'use strict';

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ApifyClient } = require('apify-client');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const cron = require('node-cron');

// ── Environment ──────────────────────────────────────────────────────────────
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

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

// ── Webhooks ─────────────────────────────────────────────────────────────────

// Webhook route needs raw body for signature verification
app.post('/api/webhook/lemonsqueezy', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
        if (!secret) {
            console.error('LEMON_SQUEEZY_WEBHOOK_SECRET is missing');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        const hmac = crypto.createHmac('sha256', secret);
        const digest = Buffer.from(hmac.update(req.body).digest('hex'), 'utf8');
        const signature = Buffer.from(req.get('X-Signature') || '', 'utf8');

        if (!crypto.timingSafeEqual(digest, signature)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const payload = JSON.parse(req.body.toString('utf8'));
        const eventName = payload.meta.event_name;

        console.log(`[Webhook] Received LemonSqueezy event: ${eventName}`);

        if (eventName === 'order_created' || eventName === 'subscription_created' || eventName === 'subscription_updated') {
            const customerEmail = payload.data.attributes.user_email;
            const productName = (payload.data.attributes.first_order_item?.product_name || payload.data.attributes.product_name || '').toLowerCase();

            let tier = 'freelancer'; // Default fallback
            if (productName.includes('agency')) {
                tier = 'agency';
            } else if (productName.includes('freelancer') || productName.includes('pro')) {
                tier = 'freelancer';
            }

            const userId = payload.meta.custom_data?.user_id;

            if (userId) {
                await supabaseAdmin.from('users').update({ subscription_tier: tier }).eq('id', userId);
                console.log(`[Webhook] Upgraded user ${userId} to ${tier} via custom_data`);
            } else if (customerEmail) {
                // Fallback to email matching
                const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', customerEmail).single();
                if (user) {
                    await supabaseAdmin.from('users').update({ subscription_tier: tier }).eq('id', user.id);
                    console.log(`[Webhook] Upgraded user ${user.id} (via email ${customerEmail}) to ${tier}`);
                } else {
                    console.warn(`[Webhook] User not found for email: ${customerEmail}`);
                }
            }
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook Error:', err);
        res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
});

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

    let prompt = `You are a B2B SaaS founder doing smart, intent - based outreach.
A prospect has just publicly posted the following on ${platform}:

            "${postContext}"

Write a single, authentic reply to this post.Your goal is to start a genuine conversation — NOT to pitch immediately.

Tone guide: ${toneDesc}

Rules:
            - Write ONLY the reply text.No preamble, no "Here is the reply:", no quote of the original post.
- Do not use hollow phrases like "Great post!" or "I totally agree!".
- Reference something specific from their post to show you actually read it.
- End with a soft conversation - starter(a question or light CTA).`;

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
async function runAutomatedScrape(workspaceId, rawKeywords, platforms) {
    if (!rawKeywords) return 0;
    const keywordArray = rawKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (!keywordArray.length) return 0;

    const oneWeekAgoMs = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const oneWeekAgoDate = new Date(oneWeekAgoMs);
    const twitterSinceDate = oneWeekAgoDate.toISOString().split('T')[0];
    const isRecent = (dateString) => {
        if (!dateString) return true;
        return new Date(dateString).getTime() >= oneWeekAgoMs;
    };

    const scrapeTasks = [];
    if (platforms.has('reddit')) {
        scrapeTasks.push((async () => {
            const run = await apify.actor('trudax/reddit-scraper-lite').call({
                searches: keywordArray,
                maxItems: 15,
                maxPostCount: 15,
                sort: "new",
                time: "week"
            });
            const { items } = await apify.dataset(run.defaultDatasetId).listItems();
            const lowerCaseKeywords = keywordArray.map(k => k.toLowerCase());
            return items.filter(i => {
                if (!(i.body || i.title)) return false;
                const text = String(i.body || i.title).toLowerCase();
                const hasExactKeyword = lowerCaseKeywords.some(kw => text.includes(kw));
                return hasExactKeyword && isRecent(i.createdAt || i.created_at || i.parsedCreatedAt);
            }).map(item => ({
                workspace_id: workspaceId,
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
    if (platforms.has('twitter')) {
        scrapeTasks.push((async () => {
            const run = await apify.actor('fastcrawler/tweet-x-twitter-scraper-0-2-1k-pay-per-result-v2').call({
                searchTerms: keywordArray.map(k => `${k} since:${twitterSinceDate} `),
                maxItems: 10,
                searchMode: "live"
            });
            const { items } = await apify.dataset(run.defaultDatasetId).listItems();
            return items.filter(i => (i.text || i.full_text) && isRecent(i.createdAt || i.created_at)).map(item => ({
                workspace_id: workspaceId,
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
    if (platforms.has('linkedin')) {
        const linkedInPromises = keywordArray.map(async (keyword) => {
            try {
                const run = await apify.actor('harvestapi/linkedin-post-search').call({
                    keywords: keyword,
                    maxResults: 15
                });
                const { items } = await apify.dataset(run.defaultDatasetId).listItems();
                return items || [];
            } catch (err) {
                console.error(`LinkedIn scrape failed for keyword: ${keyword}`, err);
                return [];
            }
        });
        scrapeTasks.push((async () => {
            const resultsArray = await Promise.all(linkedInPromises);
            const allItems = resultsArray.flat();
            const lowerCaseKeywords = keywordArray.map(k => k.toLowerCase());
            return allItems.filter(i => {
                if (!i.text) return false;
                const text = i.text.toLowerCase();
                const hasExactKeyword = lowerCaseKeywords.some(kw => text.includes(kw));
                return hasExactKeyword && isRecent(i.postedAt || i.date);
            }).map(item => ({
                workspace_id: workspaceId,
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

    const results = await Promise.allSettled(scrapeTasks);
    const signalsToInsert = [];
    results.forEach(res => {
        if (res.status === 'fulfilled' && res.value) {
            signalsToInsert.push(...res.value);
        } else if (res.status === 'rejected') {
            console.error(`[Scrape] Platform scrape failed for ws ${workspaceId}:`, res.reason);
        }
    });

    if (signalsToInsert.length > 0) {
        const { count } = await supabaseAdmin.from('signals').insert(signalsToInsert, { count: 'exact' });
        await supabaseAdmin.from('workspaces').update({ last_scraped_at: new Date().toISOString() }).eq('id', workspaceId);
        return count || signalsToInsert.length;
    }
    return 0;
}

app.post('/api/cron/scrape', requireCronSecret, async (req, res) => {
    console.log('🤖 Scrape endpoint triggered via HTTP cron!');
    const { data: workspaces, error: wsErr } = await supabaseAdmin.from('workspaces').select('id, keywords').not('keywords', 'is', null);
    const { data: profiles } = await supabaseAdmin.from('social_profiles').select('workspace_id, platform');
    if (wsErr || !workspaces || workspaces.length === 0) {
        return res.json({ inserted: 0, workspaces_scraped: 0 });
    }
    const workspacePlatforms = {};
    if (profiles) {
        profiles.forEach(p => {
            if (!workspacePlatforms[p.workspace_id]) workspacePlatforms[p.workspace_id] = new Set();
            workspacePlatforms[p.workspace_id].add(p.platform);
        });
    }

    let totalInserted = 0;
    let workspacesScraped = 0;

    await Promise.allSettled(workspaces.map(async (workspace) => {
        const platforms = workspacePlatforms[workspace.id] || new Set(['reddit']);
        const count = await runAutomatedScrape(workspace.id, workspace.keywords, platforms);
        if (count > 0) {
            totalInserted += count;
            workspacesScraped++;
        }
    }));
    return res.json({ ok: true, inserted: totalInserted, workspaces_scraped: workspacesScraped });
});

app.post('/api/scrape', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) return res.status(401).json({ error: 'Invalid or missing token' });

        const userId = user.id;
        const { workspaceId, keywords } = req.body;
        if (!workspaceId) return res.status(400).json({ error: 'Missing workspaceId' });

        const { data: userData } = await supabaseAdmin.from('users').select('subscription_tier').eq('id', userId).single();
        const tier = userData?.subscription_tier || 'free';

        if (tier === 'free') {
            const { data: wsData } = await supabaseAdmin.from('workspaces').select('last_scraped_at').eq('id', workspaceId).single();
            if (wsData?.last_scraped_at) {
                const hoursSinceLastScrape = (new Date() - new Date(wsData.last_scraped_at)) / (1000 * 60 * 60);
                if (hoursSinceLastScrape < 24) {
                    return res.status(429).json({ error: "Free tier allows 1 manual sync per 24 hours. Upgrade to unlock unlimited manual syncs!" });
                }
            }
        }

        const { data: profiles } = await supabaseAdmin.from('social_profiles').select('platform').eq('workspace_id', workspaceId);
        const platforms = new Set(profiles?.map(p => p.platform) || ['reddit']);

        const inserted = await runAutomatedScrape(workspaceId, keywords, platforms);
        res.json({ success: true, inserted });
    } catch (error) {
        console.error('Manual scrape error:', error);
        res.status(500).json({ error: 'Failed to scrape manually' });
    }
});

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({ status: 'SignalReach Gateway Active' });
});

/**
 * POST /api/generate-keywords
 * AI Keyword Generation Route
 */
app.post('/api/generate-keywords', async (req, res) => {
    try {
        const { niche } = req.body;
        if (!niche) return res.status(400).json({ error: 'Niche is required' });
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `You are an expert lead generation specialist building exact - match search queries for a social media scraper(Reddit, Twitter, LinkedIn). 
The user's niche or job title is: "${niche}".
Generate exactly 4 short, highly specific, high - intent search phrases that a founder or client would naturally type when looking to hire for this exact niche, or when expressing a problem this niche solves.

STRICT RULES:

Keep phrases under 6 words.

Use natural, everyday human language(e.g., "hiring a product designer", "need a UI revamp", "looking for freelance UX").

DO NOT invent acronyms.Stick strictly to widely known industry terms based on the user's input.

        CRITICAL: Return ONLY a single line of comma - separated phrases.No bullet points, no quotation marks, no conversational text.`;

        const result = await model.generateContent(prompt);
        const keywords = result.response.text().trim();

        res.json({ keywords });
    } catch (error) {
        console.error('AI Keyword Error:', error);
        res.status(500).json({ error: 'Failed to generate keywords' });
    }
});

/**
 * POST /api/generate-draft
 * Body: { postContext: string, platform: string, tone: string }
 * Returns: { draft: string }
 */
app.post('/api/generate-draft', async (req, res) => {
    try {
        const { post_content, tone, instructions, platform } = req.body;
        if (!post_content) return res.status(400).json({ error: 'Post content required' });
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        let prompt = `You are an expert sales development rep.A prospect posted this on social media: \n\n"${post_content}"\n\nWrite a highly personalized direct message to pitch a freelance design or UX service.`;
        if (tone) prompt += `\nUse a ${tone} tone.`;
        if (instructions) prompt += `\nAdditional instructions from the user: ${instructions} `;

        if (platform?.toLowerCase() === 'twitter') {
            prompt += `\n\nCRITICAL RULE: This is for Twitter.You MUST keep the entire response under 40 words total.Do not exceed 40 words.Make it punchy, no hashtags, no quotes.`;
        } else if (platform?.toLowerCase() === 'linkedin') {
            prompt += `\n\nCRITICAL RULE: This is for LinkedIn.Keep it under 60 words total.No quotes.`;
        } else {
            prompt += `\n\nCRITICAL RULE: Keep it natural, under 3 sentences.No quotes.`;
        }

        const result = await model.generateContent(prompt);
        res.json({ draft: result.response.text().trim() });
    } catch (error) {
        console.error('AI Draft Error:', error);
        res.status(500).json({ error: 'Failed to generate draft' });
    }
});

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// ── Automated Cron Schedules ─────────────────────────────────────────────────

// EVERY 6 HOURS: Only Agency users who selected '6h'
cron.schedule('0 0,6,12,18 * * *', async () => {
    console.log('[Cron] Running 6h scrape schedule...');
    const { data: workspaces } = await supabaseAdmin
        .from('workspaces')
        .select('id, keywords, user_id, users!inner(subscription_tier)')
        .eq('scrape_frequency', '6h')
        .eq('users.subscription_tier', 'agency');

    if (workspaces) {
        for (const ws of workspaces) {
            const { data: profiles } = await supabaseAdmin.from('social_profiles').select('platform').eq('workspace_id', ws.id);
            const platforms = new Set(profiles?.map(p => p.platform) || ['reddit']);
            await runAutomatedScrape(ws.id, ws.keywords, platforms);
        }
    }
});

// DAILY (Midnight): Freelancer or Agency users who selected '24h'
cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running 24h scrape schedule...');
    const { data: workspaces } = await supabaseAdmin
        .from('workspaces')
        .select('id, keywords, user_id, users!inner(subscription_tier)')
        .eq('scrape_frequency', '24h')
        .in('users.subscription_tier', ['freelancer', 'agency']);

    if (workspaces) {
        for (const ws of workspaces) {
            const { data: profiles } = await supabaseAdmin.from('social_profiles').select('platform').eq('workspace_id', ws.id);
            const platforms = new Set(profiles?.map(p => p.platform) || ['reddit']);
            await runAutomatedScrape(ws.id, ws.keywords, platforms);
        }
    }
});

// WEEKLY (Sunday at Midnight): Anyone who selected '7d'
cron.schedule('0 0 * * 0', async () => {
    console.log('[Cron] Running 7d scrape schedule...');
    const { data: workspaces } = await supabaseAdmin
        .from('workspaces')
        .select('id, keywords, user_id, users!inner(subscription_tier)')
        .eq('scrape_frequency', '7d')
        .in('users.subscription_tier', ['freelancer', 'agency']);

    if (workspaces) {
        for (const ws of workspaces) {
            const { data: profiles } = await supabaseAdmin.from('social_profiles').select('platform').eq('workspace_id', ws.id);
            const platforms = new Set(profiles?.map(p => p.platform) || ['reddit']);
            await runAutomatedScrape(ws.id, ws.keywords, platforms);
        }
    }
});

// ── Start ────────────────────────────────────────────────────────────────────
if (process.argv.includes('--scrape')) {
    console.log('[CLI] Running immediate manual scrape for all workspaces as requested...');
    (async () => {
        try {
            const { data: workspaces, error: wsErr } = await supabaseAdmin.from('workspaces').select('id, keywords').not('keywords', 'is', null);
            console.log('[DEBUG] Query result:', JSON.stringify(workspaces), 'Error:', wsErr);
            const { data: profiles } = await supabaseAdmin.from('social_profiles').select('workspace_id, platform');
            if (wsErr || !workspaces || workspaces.length === 0) {
                console.log('[CLI] No keywords or workspaces found to scrape.');
                process.exit(0);
            }
            const workspacePlatforms = {};
            if (profiles) {
                profiles.forEach(p => {
                    if (!workspacePlatforms[p.workspace_id]) workspacePlatforms[p.workspace_id] = new Set();
                    workspacePlatforms[p.workspace_id].add(p.platform);
                });
            }

            let totalInserted = 0;
            let workspacesScraped = 0;

            await Promise.allSettled(workspaces.map(async (workspace) => {
                const platforms = workspacePlatforms[workspace.id] || new Set(['reddit']);
                const count = await runAutomatedScrape(workspace.id, workspace.keywords, platforms);
                if (count > 0) {
                    totalInserted += count;
                    workspacesScraped++;
                }
            }));
            
            console.log(`[CLI] Scrape Complete! Inserted ${totalInserted} signals across ${workspacesScraped} workspaces.`);
            process.exit(0);
        } catch (err) {
            console.error('[CLI] Scrape Error:', err);
            process.exit(1);
        }
    })();
} else {
    app.listen(PORT, () => {
        console.log(`[SignalReach] 🚀  Gateway running on http://localhost:${PORT}`);
    });
}
