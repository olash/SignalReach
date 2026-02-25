'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIActionPanelProps {
    /** Whether the drawer is visible */
    isOpen: boolean;
    /** Callback to close the drawer */
    onClose: (statusUpdated?: boolean) => void;
    /** Prospect data to power the UI */
    prospect?: {
        id: string; // Need ID for database update
        platform: 'reddit' | 'twitter' | 'linkedin';
        handle: string;
        originalPost: string;
        postUrl: string | null; // Need URL to open
        /** Override for the timezone alert text */
        timezoneNote?: string;
    };
}

type Tone = 'Friendly' | 'Professional' | 'Challenger';

// ─── Mock AI Drafts ───────────────────────────────────────────────────────────

const MOCK_DRAFTS: string[] = [
    "Hey! I saw your post and completely relate. We built SignalReach exactly for this — it listens to Reddit & Twitter for buying intent so you only reach out when someone is already looking. Happy to show you a quick demo if you're curious 🙌",
    "This is exactly the problem we solve at SignalReach. Instead of cold outreach, we track intent signals in real-time so your team only engages when a prospect is actively asking. Worth a 15-min call?",
    "Bold take, but the data agrees with you. Most cold email is just noise. SignalReach flips the model — we detect when your ideal buyer voices a problem publicly, then surfaces it for you. No spray, all intent.",
];

// ─── Platform Config ──────────────────────────────────────────────────────────

const platformConfig = {
    reddit: {
        icon: 'solar:reddit-linear',
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        label: 'Reddit',
        /** null = no limit */
        limit: null as number | null,
    },
    twitter: {
        icon: 'solar:twitter-linear',
        color: 'text-sky-500',
        bg: 'bg-sky-50',
        label: 'Twitter / X',
        limit: 280,
    },
    linkedin: {
        icon: 'solar:linkedin-linear',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        label: 'LinkedIn',
        limit: null as number | null,
    },
};

// ─── Tone Config ──────────────────────────────────────────────────────────────

const TONES: Tone[] = ['Friendly', 'Professional', 'Challenger'];

const toneIcons: Record<Tone, string> = {
    Friendly: 'solar:emoji-funny-square-linear',
    Professional: 'solar:user-id-linear',
    Challenger: 'solar:fire-linear',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIActionPanel({
    isOpen,
    onClose,
    prospect,
}: AIActionPanelProps) {
    const [drafts, setDrafts] = useState<string[]>([]);
    const [currentDraftIndex, setCurrentDraftIndex] = useState(0);
    const [tone, setTone] = useState<string>('Friendly');
    const [instructions, setInstructions] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const platform = prospect?.platform ?? 'twitter';
    const pc = platformConfig[platform];
    const charLimit = pc.limit;
    const currentDraft = drafts[currentDraftIndex] || '';
    const charCount = currentDraft.length;
    const overLimit = charLimit !== null && charCount > charLimit;

    // Reset state when a new signal is selected
    useEffect(() => {
        setDrafts([]);
        setCurrentDraftIndex(0);
        setInstructions('');
        setTone('Friendly');
    }, [prospect?.id, isOpen]); // Also clear when opened

    // Lock body scroll while open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // ── Handlers ────────────────────────────────────────────────────────────────

    const handleGenerate = async () => {
        if (!prospect?.originalPost) return;
        setIsGenerating(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/generate-draft`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        post_content: prospect.originalPost,
                        tone,
                        instructions,
                    }),
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error ?? `Server error ${res.status}`);
            }

            const data = await res.json();
            if (data.draft) {
                const newDrafts = [...drafts, data.draft];
                setDrafts(newDrafts);
                setCurrentDraftIndex(newDrafts.length - 1); // Jump to newest draft
                toast('✨ New draft generated!', { duration: 2000 });
            }
        } catch (err) {
            console.error('[AIActionPanel] handleGenerate error:', err);
            toast.error('The AI took a nap. 💤 Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const nextDraft = () => {
        if (currentDraftIndex < drafts.length - 1) setCurrentDraftIndex((prev) => prev + 1);
    };

    const prevDraft = () => {
        if (currentDraftIndex > 0) setCurrentDraftIndex((prev) => prev - 1);
    };

    const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const updatedDrafts = [...drafts];
        updatedDrafts[currentDraftIndex] = e.target.value;
        setDrafts(updatedDrafts);
    };

    const handleCopyAndEngage = async () => {
        try {
            await navigator.clipboard.writeText(currentDraft);
        } catch {
            console.warn('Clipboard write failed.');
        }

        // 1. Open the original post in a new tab
        if (prospect?.postUrl) {
            window.open(prospect.postUrl, '_blank', 'noopener,noreferrer');
        }

        // 2. Update the database status to 'replied'
        if (prospect?.id) {
            const { error } = await supabase
                .from('signals')
                .update({ status: 'replied' })
                .eq('id', prospect.id);

            if (error) {
                toast.error('Failed to update status.');
                console.error('Status update error:', error);
                return;
            }
        }

        toast.success('Copied! Now paste your reply in the new tab.');
        onClose(true); // Tell parent to refresh data
    };


    // ── Render ───────────────────────────────────────────────────────────────────
    // NOTE: We always render both overlay and panel so CSS transitions play properly.
    // Visibility is controlled via opacity / transform, not conditional mounting.

    return (
        <>
            {/* ── Dimmed Overlay ──────────────────────────────────────────────────── */}
            <div
                aria-hidden="true"
                onClick={() => onClose()}
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            />

            {/* ── Slide-in Panel ──────────────────────────────────────────────────── */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="AI Reply Panel"
                className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* ── Header ────────────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Platform icon badge */}
                        <div
                            className={`w-9 h-9 rounded-lg ${pc.bg} flex items-center justify-center shrink-0`}
                        >
                            {/* @ts-expect-error – iconify-icon is a custom element */}
                            <iconify-icon icon={pc.icon} class={`text-xl ${pc.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                                {prospect?.handle ?? '@unknown'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                {pc.label} · AI Reply Draft
                            </p>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => onClose()}
                        aria-label="Close panel"
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                        {/* @ts-expect-error – iconify-icon is a custom element */}
                        <iconify-icon icon="solar:close-circle-linear" class="text-xl" />
                    </button>
                </div>

                {/* ── Scrollable Body ─────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

                    {/* 1 ─ Context View */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                            Original Signal
                        </p>
                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg text-sm text-gray-600 leading-relaxed">
                            {prospect?.originalPost ??
                                '"Looking for alternatives to generic CRMs for my sales team — any recommendations that actually track intent?"'}
                        </div>
                    </div>

                    {/* 2 ─ Timezone Whisperer */}
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs px-3 py-2 rounded-md border border-indigo-100">
                        {/* @ts-expect-error – iconify-icon is a custom element */}
                        <iconify-icon icon="solar:moon-sleep-linear" class="text-sm shrink-0" />
                        <span>
                            {prospect?.timezoneNote ??
                                "🌙 It's currently 1:00 AM for this user. Draft now, but consider sending later."}
                        </span>
                    </div>

                    {/* 3 ─ Draft Tone */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-2">
                            Draft Tone
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { name: 'Friendly', icon: 'solar:emoji-funny-square-linear' },
                                { name: 'Professional', icon: 'solar:user-id-linear' },
                                { name: 'Challenger', icon: 'solar:fire-linear' }
                            ].map(t => (
                                <button
                                    key={t.name}
                                    onClick={() => setTone(t.name)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${tone === t.name
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-800'
                                        }`}
                                >
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon={t.icon} class="text-sm"></iconify-icon>
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4 ─ Custom Instructions */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1.5">
                            Custom instructions{' '}
                            <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            placeholder="e.g., mention the free audit, keep it under 2 sentences…"
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-[#F9FAFB] border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-200"
                            type="text"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>

                    {/* 5 ─ Draft Textarea */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-medium text-gray-500">AI Draft</p>
                            {isGenerating && (
                                <span className="text-[10px] text-indigo-500 flex items-center gap-1 animate-pulse">
                                    {/* @ts-expect-error – iconify-icon is a custom element */}
                                    <iconify-icon
                                        icon="solar:refresh-linear"
                                        class="text-xs animate-spin"
                                    />
                                    Generating…
                                </span>
                            )}
                        </div>

                        <textarea
                            rows={6}
                            className="w-full px-3.5 py-3 h-40 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none transition-all duration-200 leading-relaxed text-gray-800 bg-white"
                            value={drafts[currentDraftIndex] || ""}
                            onChange={handleDraftChange}
                            placeholder={isGenerating ? "Generating draft..." : ""}
                            disabled={drafts.length === 0 && !isGenerating}
                        />

                        {/* Platform-Aware Character Counter */}
                        <div className="flex justify-end mt-1">
                            {charLimit !== null ? (
                                <span
                                    className={`text-xs font-medium tabular-nums flex items-center gap-1 ${overLimit ? 'text-red-500' : 'text-gray-500'
                                        }`}
                                >
                                    {overLimit && (
                                        /* @ts-expect-error – iconify-icon is a custom element */
                                        <iconify-icon
                                            icon="solar:danger-triangle-linear"
                                            class="text-xs"
                                        />
                                    )}
                                    {charCount} / {charLimit}
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500 tabular-nums">
                                    {charCount} chars
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Action Bar ────────────────────────────────────────────────────── */}
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white">

                    {/* Left: Regenerate + version navigation */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:refresh-linear" class={`text-sm ${isGenerating ? 'animate-spin' : ''}`}></iconify-icon>
                            {drafts.length === 0 ? "Generate Draft" : "Regenerate"}
                        </button>

                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden divide-x divide-gray-200">
                            <button
                                onClick={prevDraft}
                                disabled={currentDraftIndex === 0}
                                className={`px-2 py-2 transition-colors ${currentDraftIndex === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:alt-arrow-left-linear" class="text-xs"></iconify-icon>
                            </button>
                            <span className="text-[10px] text-gray-500 font-medium px-2 py-2 tabular-nums whitespace-nowrap select-none bg-white">
                                {drafts.length > 0 ? `${currentDraftIndex + 1} of ${drafts.length}` : '0 of 0'}
                            </span>
                            <button
                                onClick={nextDraft}
                                disabled={currentDraftIndex === drafts.length - 1 || drafts.length === 0}
                                className={`px-2 py-2 transition-colors ${currentDraftIndex === drafts.length - 1 || drafts.length === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:alt-arrow-right-linear" class="text-xs"></iconify-icon>
                            </button>
                        </div>
                    </div>

                    {/* Right: Primary CTA */}
                    <button
                        onClick={handleCopyAndEngage}
                        disabled={overLimit}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-150 shadow-sm whitespace-nowrap"
                    >
                        {/* @ts-expect-error – iconify-icon is a custom element */}
                        <iconify-icon icon="solar:copy-linear" class="text-sm" />
                        Copy &amp; Mark Engaged
                    </button>
                </div>
            </div>
        </>
    );
}
