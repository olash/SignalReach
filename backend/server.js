'use strict';

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ApifyClient } = require('apify-client');
const { createClient } = require('@supabase/supabase-js');

// ── Environment ──────────────────────────────────────────────────────────────
dotenv.config();

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('[SignalReach] ❌  GEMINI_API_KEY is not set. Check your .env file.');
    process.exit(1);
}

// ── Apify client ─────────────────────────────────────────────────────────────
const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// ── Supabase admin client (service-role — bypasses RLS for backend use only) ─
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Gemini client ────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();

// ── CORS allowlist ────────────────────────────────────────────────────────────
// Accepts the production Vercel frontend + localhost for local dev.
// Every other origin is rejected to protect the Gemini API key.
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL,          // e.g. https://signal-reach.vercel.app
    'http://localhost:3000',            // Next.js dev server
    'http://localhost:3001',            // alternate dev port
].filter(Boolean); // drop undefined if FRONTEND_URL is not set

app.use(
    cors({
        origin(requestOrigin, callback) {
            // Allow server-to-server requests (no Origin header)
            if (!requestOrigin) return callback(null, true);

            if (ALLOWED_ORIGINS.includes(requestOrigin)) {
                callback(null, true);
            } else {
                console.warn(`[SignalReach] CORS blocked: ${requestOrigin}`);
                callback(new Error(`Origin ${requestOrigin} is not allowed by CORS`));
            }
        },
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.use(express.json());

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a platform- and tone-aware prompt for Gemini.
 * @param {string} postContext  - The prospect's original post / signal text
 * @param {string} platform     - 'twitter' | 'reddit' | 'linkedin'
 * @param {string} tone         - 'friendly' | 'professional' | 'challenger'
 * @returns {string} The final prompt string
 */
function buildPrompt(postContext, platform, tone) {
    // Tone guidance
    const toneMap = {
        friendly:
            'Warm, human, and casual. Use first-person ("I"), sound like a real person. Emoji is acceptable but not required.',
        professional:
            'Polished and business-appropriate. No slang or emoji. Lead with value.',
        challenger:
            'Slightly provocative and confident. Challenge the conventional thinking in the post. Be direct and bold.',
    };

    const toneDesc = toneMap[tone.toLowerCase()] ?? toneMap['friendly'];

    let prompt = `You are a B2B SaaS founder doing smart, intent-based outreach.
A prospect has just publicly posted the following on ${platform}:

"${postContext}"

Write a single, authentic reply to this post. Your goal is to start a genuine conversation — NOT to pitch immediately.

Tone guide: ${toneDesc}

Rules:
- Write ONLY the reply text. No preamble, no "Here is the reply:", no quote of the original post.
- Do not use hollow phrases like "Great post!" or "I totally agree!".
- Reference something specific from their post to show you actually read it.
- End with a soft conversation-starter (a question or light CTA).`;

    // Platform-specific constraint
    if (platform.toLowerCase() === 'twitter') {
        prompt +=
            '\n- You MUST keep the response under 280 characters. Be punchy and concise. Every word counts.';
    }

    return prompt;
}

// ── Cron secret guard ────────────────────────────────────────────────────────

/**
 * Middleware: require Authorization: Bearer <CRON_SECRET> header.
 * Returns 401 if missing or wrong — protects the scrape endpoint from
 * being triggered by anyone other than the authorised cron caller.
 */
function requireCronSecret(req, res, next) {
    const authHeader = req.headers['authorization'] ?? '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || token !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/cron/scrape
 * Headers: Authorization: Bearer <CRON_SECRET>
 *
 * For every workspace with non-null keywords:
 *  1. Runs the Apify Reddit scraper with those keywords.
 *  2. Maps the results to the `leads` schema.
 *  3. Upserts them into public.leads.
 *
 * Designed to be called by a cron service (e.g. Vercel Cron, GitHub Actions).
 */
app.post('/api/cron/scrape', requireCronSecret, async (req, res) => {
    console.log('🤖 Scrape endpoint triggered!');
    // 1 ── Fetch workspaces and their connected platforms
    const { data: workspaces, error: wsErr } = await supabaseAdmin.from('workspaces').select('id, keywords').not('keywords', 'is', null);
    const { data: profiles } = await supabaseAdmin.from('social_profiles').select('workspace_id, platform');
    if (wsErr || !workspaces || workspaces.length === 0) {
        return res.json({ inserted: 0, workspaces_scraped: 0 });
    }
    // Group platforms by workspace ID
    const workspacePlatforms = {};
    if (profiles) {
        profiles.forEach(p => {
            if (!workspacePlatforms[p.workspace_id]) workspacePlatforms[p.workspace_id] = new Set();
            workspacePlatforms[p.workspace_id].add(p.platform);
        });
    }
    let totalInserted = 0;
    let workspacesScraped = 0;

    // Calculate exactly 7 days ago for strict filtering and Twitter search
    const oneWeekAgoMs = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const oneWeekAgoDate = new Date(oneWeekAgoMs);
    const twitterSinceDate = oneWeekAgoDate.toISOString().split('T')[0];
    // Helper function to rigorously check the date (safety net)
    const isRecent = (dateString) => {
        if (!dateString) return true;
        return new Date(dateString).getTime() >= oneWeekAgoMs;
    };

    // 2 ── Process workspaces concurrently
    await Promise.allSettled(workspaces.map(async (workspace) => {
        // Safely extract and trim keywords, defaulting to empty string if null
        const rawKeywords = workspace.keywords ? workspace.keywords.trim() : '';
        // HARD STOP: If keywords are empty after trimming, skip this workspace completely
        if (!rawKeywords) {
            console.log(`[cron/scrape] ⏭️  Skipping workspace ${workspace.id}: No valid keywords found.`);
            return;
        }

        // Split by comma and clean up, so Apify gets an actual array of separate terms
        const keywordArray = rawKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);

        const platforms = workspacePlatforms[workspace.id] || new Set(['reddit']); // Default to Reddit
        const scrapeTasks = [];
        //  REDDIT SCRAPER
        if (platforms.has('reddit')) {
            scrapeTasks.push((async () => {
                const run = await apify.actor('trudax/reddit-scraper-lite').call({
                    searches: keywordArray,
                    maxItems: 15,
                    maxPostCount: 15,
                    sort: "new",
                    time: "week" // Strictly limits extraction to the past 7 days
                });
                const { items } = await apify.dataset(run.defaultDatasetId).listItems();
                return items.filter(i => (i.body || i.title) && isRecent(i.createdAt || i.created_at || i.parsedCreatedAt)).map(item => ({
                    workspace_id: workspace.id,
                    platform: 'reddit',
                    intent_score: 'Medium',
                    original_post_id: String(item.id || item.parsedId || item.url || Date.now()),
                    author_handle: String(item.username || item.author || 'Unknown User'),
                    post_content: String(item.body || item.title || '').substring(0, 1000),
                    post_url: item.url,
                    status: 'new'
                }));
            })());
        }
        // 🔵 TWITTER SCRAPER (Using fastcrawler)
        if (platforms.has('twitter')) {
            scrapeTasks.push((async () => {
                const run = await apify.actor('fastcrawler/tweet-x-twitter-scraper-0-2-1k-pay-per-result-v2').call({
                    searchTerms: keywordArray.map(k => `${k} since:${twitterSinceDate}`),
                    maxItems: 10,
                    searchMode: "live"
                });
                const { items } = await apify.dataset(run.defaultDatasetId).listItems();

                return items.filter(i => (i.text || i.full_text) && isRecent(i.createdAt || i.created_at)).map(item => ({
                    workspace_id: workspace.id,
                    platform: 'twitter',
                    intent_score: 'Medium',
                    original_post_id: String(item.id || item.url || Date.now()),
                    author_handle: String(item.author?.userName || item.user?.screen_name || 'Unknown User'),
                    post_content: String(item.text || item.full_text || '').substring(0, 1000),
                    post_url: item.url,
                    status: 'new'
                }));
            })());
        }

        // 👔 LINKEDIN SCRAPER (Using harvestapi/linkedin-post-search)
        if (platforms.has('linkedin')) {
            scrapeTasks.push((async () => {
                const run = await apify.actor('harvestapi/linkedin-post-search').call({
                    keywords: keywordArray.join(' OR '),
                    maxResults: 10,
                    datePosted: "past-week", // Strictly limits extraction to the past 7 days
                    sortBy: "date"
                });
                const { items } = await apify.dataset(run.defaultDatasetId).listItems();

                return items.filter(i => i.text && isRecent(i.postedAt || i.postedDate || i.createdAt || i.date)).map(item => ({
                    workspace_id: workspace.id,
                    platform: 'linkedin',
                    intent_score: 'Medium',
                    original_post_id: String(item.urn || item.postUrl || item.url || Date.now()),
                    author_handle: String(item.authorName || item.author?.name || 'Unknown User'),
                    post_content: String(item.text || '').substring(0, 1000),
                    post_url: item.postUrl || item.url,
                    status: 'new'
                }));
            })());
        }
        // Wait for all selected platform scrapers to finish for this workspace
        const results = await Promise.allSettled(scrapeTasks);

        // Flatten all successful data into one array
        const signalsToInsert = [];
        results.forEach(res => {
            if (res.status === 'fulfilled' && res.value) {
                signalsToInsert.push(...res.value);
            } else if (res.status === 'rejected') {
                console.error(`[cron/scrape] ❌ Platform scrape failed for ws ${workspace.id}:`, res.reason);
            }
        });
        if (signalsToInsert.length > 0) {
            const { count } = await supabaseAdmin.from('signals').insert(signalsToInsert, { count: 'exact' });
            totalInserted += count || signalsToInsert.length;
            workspacesScraped++;
        }
    }));
    return res.json({ ok: true, inserted: totalInserted, workspaces_scraped: workspacesScraped });
});

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ status: 'SignalReach Gateway Active' });
});

/**
 * POST /api/generate-draft
 * Body: { postContext: string, platform: string, tone: string }
 * Returns: { draft: string }
 */
app.post('/api/generate-draft', async (req, res) => {
    const { postContext, platform, tone } = req.body;

    // ── Input validation ──
    if (!postContext || typeof postContext !== 'string' || !postContext.trim()) {
        return res.status(400).json({ error: 'postContext is required and must be a non-empty string.' });
    }
    if (!platform || typeof platform !== 'string') {
        return res.status(400).json({ error: 'platform is required (e.g. twitter, reddit, linkedin).' });
    }
    if (!tone || typeof tone !== 'string') {
        return res.status(400).json({ error: 'tone is required (e.g. friendly, professional, challenger).' });
    }

    const prompt = buildPrompt(postContext.trim(), platform.trim(), tone.trim());

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent(prompt);
        const response = result.response;
        const draft = response.text().trim();

        return res.json({ draft });
    } catch (err) {
        console.error('[SignalReach] Gemini error:', err?.message ?? err);
        return res.status(500).json({
            error: 'The AI took a nap. 💤 Please try regenerating.',
        });
    }
});

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[SignalReach] 🚀  Gateway running on http://localhost:${PORT}`);
});
