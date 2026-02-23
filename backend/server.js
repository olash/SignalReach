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
    console.log('[cron/scrape] 🕐  Run started at', new Date().toISOString());

    // 1 ── Fetch all workspaces that have keywords configured
    const { data: workspaces, error: wsErr } = await supabaseAdmin
        .from('workspaces')
        .select('id, keywords')
        .not('keywords', 'is', null);

    console.log('📊 Workspaces found:', workspaces?.length || 0);

    if (wsErr) {
        console.error('[cron/scrape] ❌  Failed to fetch workspaces:', wsErr.message);
        return res.status(500).json({ error: 'Failed to fetch workspaces', detail: wsErr.message });
    }

    if (!workspaces || workspaces.length === 0) {
        console.log('⚠️ No workspaces with keywords found. Exiting.');
        console.log('[cron/scrape] ℹ️  No workspaces with keywords found. Nothing to scrape.');
        return res.json({ inserted: 0, workspaces_scraped: 0 });
    }

    let totalInserted = 0;
    let workspacesScraped = 0;

    // 2 ── Process each workspace independently — one failure won't stop the rest
    await Promise.allSettled(
        workspaces.map(async (workspace) => {
            try {
                const keywords = workspace.keywords.trim();
                if (!keywords) return;

                console.log(`[cron/scrape] 🔍  Scraping for workspace ${workspace.id}: "${keywords}"`);

                console.log('🚀 Calling Apify for workspace:', workspace.id, 'with keywords:', workspace.keywords);
                // 2a ── Start the Apify Reddit scraper run
                const run = await apify.actor('trudax/reddit-scraper').call({
                    searchQueries: [keywords],
                    maxItems: 10,
                }, { waitSecs: 120 }); // wait up to 2 min for run to finish

                // 2b ── Fetch the dataset items from the completed run
                const { items } = await apify.dataset(run.defaultDatasetId).listItems();

                if (!items || items.length === 0) {
                    console.log(`[cron/scrape] ℹ️  No results for workspace ${workspace.id}`);
                    return;
                }

                // 2c ── Map items to the signals table schema
                const signals = items
                    .filter((item) => item.body || item.title) // skip empty posts
                    .map((item) => ({
                        workspace_id: workspace.id,
                        platform: 'reddit',
                        author_handle: item.author ?? 'unknown',
                        post_content: (item.body || item.title || '').slice(0, 5000),
                        post_url: item.url ?? item.permalink ?? null,
                        status: 'new',
                    }));

                if (signals.length === 0) return;

                // 2d ── Insert into public.signals
                const { error: insertErr, count } = await supabaseAdmin
                    .from('signals')
                    .insert(signals, { count: 'exact' });

                if (insertErr) {
                    console.error(`[cron/scrape] ❌  Insert failed for workspace ${workspace.id}:`, insertErr.message);
                    return;
                }

                const inserted = count ?? signals.length;
                totalInserted += inserted;
                workspacesScraped += 1;
                console.log(`[cron/scrape] ✅  Inserted ${inserted} signals for workspace ${workspace.id}`);

            } catch (err) {
                console.error('❌ Apify Error:', err.message);
                console.error(`[cron/scrape] ❌  Error processing workspace ${workspace.id}:`, err?.message ?? err);
            }
        })
    );

    console.log(`[cron/scrape] 🏁  Done. ${totalInserted} signals inserted across ${workspacesScraped} workspace(s).`);
    return res.json({
        ok: true,
        inserted: totalInserted,
        workspaces_scraped: workspacesScraped,
    });
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
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
