'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIActionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    prospect?: {
        platform: 'reddit' | 'twitter' | 'linkedin';
        handle: string;
        originalPost: string;
        timezoneNote?: string;
    };
}

type Tone = 'Friendly' | 'Professional' | 'Challenger';

// ─── Mock AI drafts ───────────────────────────────────────────────────────────

const MOCK_DRAFTS = [
    "Hey! I saw your post and completely relate. We built SignalReach exactly for this — it listens to Reddit & Twitter for buying intent so you only reach out when someone is already looking. Happy to show you a quick demo if you're curious 🙌",
    "This is exactly the problem we solve at SignalReach. Instead of cold outreach, we track intent signals in real-time so your team only engages when a prospect is actively asking. Worth a 15-min call?",
    "Bold take, but the data agrees with you. Most cold email is just noise. SignalReach flips the model — we detect when your ideal buyer voices a problem publicly, then surfaces it for you. No spray, all intent.",
];

// ─── Platform config ──────────────────────────────────────────────────────────

const platformConfig = {
    reddit: { icon: 'solar:reddit-linear', color: 'text-orange-500', bg: 'bg-orange-50', label: 'Reddit', limit: null },
    twitter: { icon: 'solar:twitter-linear', color: 'text-sky-500', bg: 'bg-sky-50', label: 'Twitter', limit: 280 },
    linkedin: { icon: 'solar:linkedin-linear', color: 'text-blue-600', bg: 'bg-blue-50', label: 'LinkedIn', limit: null },
};

const TONES: Tone[] = ['Friendly', 'Professional', 'Challenger'];

const toneIcons: Record<Tone, string> = {
    Friendly: 'solar:emoji-funny-square-linear',
    Professional: 'solar:user-id-linear',
    Challenger: 'solar:fire-linear',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIActionPanel({ isOpen, onClose, prospect }: AIActionPanelProps) {
    const [tone, setTone] = useState<Tone>('Friendly');
    const [customInstructions, setCustomInstructions] = useState('');
    const [draftIndex, setDraftIndex] = useState(0);
    const [draftText, setDraftText] = useState(MOCK_DRAFTS[0]);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const platform = prospect?.platform ?? 'twitter';
    const pc = platformConfig[platform];
    const charLimit = pc.limit;
    const charCount = draftText.length;
    const overLimit = charLimit !== null && charCount > charLimit;

    // Keep draft text in sync when panel opens or tone changes
    useEffect(() => {
        if (isOpen) {
            setDraftText(MOCK_DRAFTS[draftIndex]);
            setCustomInstructions('');
        }
    }, [isOpen, draftIndex]);

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        await new Promise((r) => setTimeout(r, 900));
        const next = (draftIndex + 1) % MOCK_DRAFTS.length;
        setDraftIndex(next);
        setDraftText(MOCK_DRAFTS[next]);
        setIsRegenerating(false);
        toast('✨ New draft generated!', { duration: 2000 });
    };

    const handlePrevDraft = () => {
        const prev = (draftIndex - 1 + MOCK_DRAFTS.length) % MOCK_DRAFTS.length;
        setDraftIndex(prev);
        setDraftText(MOCK_DRAFTS[prev]);
    };

    const handleNextDraft = () => {
        const next = (draftIndex + 1) % MOCK_DRAFTS.length;
        setDraftIndex(next);
        setDraftText(MOCK_DRAFTS[next]);
    };

    const handleCopyAndEngage = async () => {
        try {
            await navigator.clipboard.writeText(draftText);
        } catch {
            // fallback — just close
        }
        toast.success('Copied to clipboard! Moved to Engaged pipeline.');
        onClose();
    };

    if (!isOpen && typeof window !== 'undefined') return null;

    return (
        <>
            {/* ── Overlay ──────────────────────────────────────────────────────── */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* ── Panel ────────────────────────────────────────────────────────── */}
            <div
                className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >

                {/* ── Panel Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${pc.bg} flex items-center justify-center`}>
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon={pc.icon} class={`text-xl ${pc.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {prospect?.handle ?? '@unknown'}
                            </p>
                            <p className="text-[10px] text-gray-400">{pc.label} · AI Reply Draft</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-150"
                    >
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="solar:close-circle-linear" class="text-xl" />
                    </button>
                </div>

                {/* ── Scrollable Body ───────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

                    {/* Context View */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                            Original Signal
                        </p>
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-600 leading-relaxed">
                            {prospect?.originalPost ?? '"Looking for alternatives to generic CRMs for my sales team — any recommendations that track intent?"'}
                        </div>
                    </div>

                    {/* Timezone Whisperer */}
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs px-3 py-2.5 rounded-lg border border-indigo-100">
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="solar:moon-sleep-linear" class="text-sm shrink-0" />
                        <span>
                            {prospect?.timezoneNote ??
                                "🌙 It's currently 1:00 AM for this user. Draft now, but consider sending later."}
                        </span>
                    </div>

                    {/* Draft Tone */}
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Draft Tone</p>
                        <div className="flex gap-2 flex-wrap">
                            {TONES.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${tone === t
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-800'
                                        }`}
                                >
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon={toneIcons[t]} class="text-sm" />
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Instructions */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">
                            Custom instructions
                            <span className="text-gray-400 font-normal ml-1">(optional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., mention the free audit, keep it under 2 sentences…"
                            value={customInstructions}
                            onChange={(e) => setCustomInstructions(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-[#F9FAFB] border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-200"
                        />
                    </div>

                    {/* Draft Textarea */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-medium text-gray-500">AI Draft</p>
                            {isRegenerating && (
                                <span className="text-[10px] text-indigo-500 flex items-center gap-1 animate-pulse">
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:refresh-linear" class="text-xs animate-spin" />
                                    Generating…
                                </span>
                            )}
                        </div>
                        <textarea
                            value={draftText}
                            onChange={(e) => setDraftText(e.target.value)}
                            rows={6}
                            className="w-full px-3.5 py-3 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none transition-all duration-200 leading-relaxed"
                        />

                        {/* Character counter (twitter-mode) */}
                        <div className="flex justify-end mt-1">
                            {charLimit !== null ? (
                                <span className={`text-xs font-medium tabular-nums ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
                                    {overLimit && (
                                        /* @ts-expect-error custom element */
                                        <iconify-icon icon="solar:danger-triangle-linear" class="text-red-500 text-xs mr-1 align-middle" />
                                    )}
                                    {charCount} / {charLimit}
                                </span>
                            ) : (
                                <span className="text-xs text-gray-400 tabular-nums">{charCount} chars</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Action Bar ───────────────────────────────────────────────────── */}
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white">

                    {/* Regenerate + version navigation */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 active:scale-95 disabled:opacity-50 rounded-lg transition-all duration-150"
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon
                                icon="solar:refresh-linear"
                                class={`text-sm ${isRegenerating ? 'animate-spin' : ''}`}
                            />
                            Regenerate
                        </button>

                        {/* Version arrows */}
                        <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={handlePrevDraft}
                                className="px-2 py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:alt-arrow-left-linear" class="text-xs" />
                            </button>
                            <span className="text-[10px] text-gray-500 font-medium px-1 tabular-nums whitespace-nowrap">
                                {draftIndex + 1} of {MOCK_DRAFTS.length}
                            </span>
                            <button
                                onClick={handleNextDraft}
                                className="px-2 py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:alt-arrow-right-linear" class="text-xs" />
                            </button>
                        </div>
                    </div>

                    {/* Primary CTA */}
                    <button
                        onClick={handleCopyAndEngage}
                        disabled={overLimit}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-all duration-150 shadow-sm"
                    >
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="solar:copy-linear" class="text-sm" />
                        Copy &amp; Mark Engaged
                    </button>
                </div>
            </div>
        </>
    );
}
