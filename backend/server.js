'use strict';

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Environment ──────────────────────────────────────────────────────────────
dotenv.config();

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('[SignalReach] ❌  GEMINI_API_KEY is not set. Check your .env file.');
    process.exit(1);
}

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

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /
 * Health check — keeps the Render dyno awake.
 */
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
