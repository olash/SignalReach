'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'reddit' | 'twitter' | 'linkedin';

interface Signal {
    id: string;
    platform: Platform;
    author_handle: string;
    post_content: string;
    post_url: string | null;
    status: string;
    ai_draft?: any;
}

type Tone = 'Friendly' | 'Professional' | 'Challenger';

const TONES: Tone[] = ['Friendly', 'Professional', 'Challenger'];

const toneIcons: Record<Tone, string> = {
    Friendly: 'solar:emoji-funny-square-linear',
    Professional: 'solar:user-id-linear',
    Challenger: 'solar:fire-linear',
};

interface DraftHistory {
    text: string;
    tone: string;
    instructions: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<Platform, { icon: string; color: string; label: string; bg: string }> = {
    reddit: { icon: 'solar:reddit-linear', color: 'text-orange-500', label: 'Reddit', bg: 'bg-orange-50' },
    twitter: { icon: 'solar:twitter-linear', color: 'text-sky-500', label: 'Twitter', bg: 'bg-sky-50' },
    linkedin: { icon: 'solar:linkedin-linear', color: 'text-blue-600', label: 'LinkedIn', bg: 'bg-blue-50' },
};

const STATIC_PLACEHOLDERS: Signal[] = [
    {
        id: 'ph-1',
        platform: 'reddit',
        author_handle: 'saas_founder_99',
        post_content: 'Looking for alternatives to generic CRMs for my sales team — any recommendations that track intent and help prioritise outreach?',
        post_url: null,
        status: 'action_required',
    },
    {
        id: 'ph-2',
        platform: 'twitter',
        author_handle: 'mikk_builds',
        post_content: 'Tired of cold email tools that just spray-and-pray. Is there a smarter way to find buyers who are already looking?',
        post_url: null,
        status: 'action_required',
    },
    {
        id: 'ph-3',
        platform: 'linkedin',
        author_handle: 'carolyn_vp_sales',
        post_content: 'Our sales team is evaluating new prospecting tools this quarter. Would love to hear what is working for others in B2B SaaS.',
        post_url: 'https://www.linkedin.com',
        status: 'action_required',
    },
];

function SkeletonItem() {
    return (
        <div className="flex items-start gap-3 p-4 animate-pulse border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
                <div className="w-32 h-3 bg-gray-200 rounded" />
                <div className="w-full h-3 bg-gray-100 rounded" />
                <div className="w-3/4 h-3 bg-gray-100 rounded" />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InboxPage() {
    const [leads, setLeads] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Signal | null>(null);
    const [sending, setSending] = useState(false);

    // AI Draft State
    const [drafts, setDrafts] = useState<DraftHistory[]>([]);
    const [currentDraftIndex, setCurrentDraftIndex] = useState(0);
    const [tone, setTone] = useState<string>('Friendly');
    const [instructions, setInstructions] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLeads(STATIC_PLACEHOLDERS);
            setLoading(false);
            return;
        }

        const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

        if (!workspaces?.length) {
            setLeads(STATIC_PLACEHOLDERS);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('signals')
            .select('id, platform, author_handle, post_content, post_url, status, ai_draft')
            .eq('workspace_id', workspaces[0].id)
            .in('status', ['action_required', 'new'])
            .order('id', { ascending: false });

        if (error || !data?.length) {
            setLeads(STATIC_PLACEHOLDERS);
        } else {
            setLeads(data as Signal[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    useEffect(() => {
        if (!loading && leads.length > 0 && !selected) {
            setSelected(leads[0]);
        }
    }, [loading, leads, selected]);

    // Sync drafts when a lead is selected
    useEffect(() => {
        if (!selected) {
            setDrafts([]);
            setCurrentDraftIndex(0);
            setTone('Friendly');
            setInstructions('');
            return;
        }

        if (selected.ai_draft && Array.isArray(selected.ai_draft) && selected.ai_draft.length > 0) {
            setDrafts(selected.ai_draft);
            setCurrentDraftIndex(selected.ai_draft.length - 1);
            setTone(selected.ai_draft[selected.ai_draft.length - 1].tone || 'Friendly');
            setInstructions(selected.ai_draft[selected.ai_draft.length - 1].instructions || '');
        } else {
            setDrafts([]);
            setCurrentDraftIndex(0);
            setTone('Friendly');
            setInstructions('');
        }
    }, [selected?.id, selected?.ai_draft]);

    const handleSelect = (lead: Signal) => {
        setSelected(lead);
    };

    const saveDraftToDatabase = async (draftHistory: DraftHistory[]) => {
        if (!selected?.id) return;
        try {
            // Optimistically update local leads array so switching back remembers it
            setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, ai_draft: JSON.stringify(draftHistory) } : l));

            const { error } = await supabase
                .from('signals')
                .update({ ai_draft: JSON.stringify(draftHistory) })
                .eq('id', selected.id);
            if (error) console.error("Error saving draft:", error);
        } catch (err) {
            console.error("Failed to save draft", err);
        }
    };

    const handleGenerate = async () => {
        if (!selected?.post_content) return;
        setIsGenerating(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/generate-draft`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        post_content: selected.post_content,
                        tone,
                        instructions,
                        platform: selected.platform
                    }),
                }
            );

            if (!res.ok) throw new Error("Server error");
            const data = await res.json();
            if (data.draft) {
                const newDraftObj: DraftHistory = {
                    text: data.draft,
                    tone: tone,
                    instructions: instructions
                };
                const newDrafts = [...drafts, newDraftObj];
                setDrafts(newDrafts);
                setCurrentDraftIndex(newDrafts.length - 1);
                await saveDraftToDatabase(newDrafts);
                toast('✨ New draft generated!', { duration: 2000 });
            }
        } catch (err) {
            console.error('[Inbox] handleGenerate error:', err);
            toast.error('Failed to generate draft.');
        } finally {
            setIsGenerating(false);
        }
    };

    const nextDraft = () => {
        if (currentDraftIndex < drafts.length - 1) {
            const newIdx = currentDraftIndex + 1;
            setCurrentDraftIndex(newIdx);
            setTone(drafts[newIdx].tone);
            setInstructions(drafts[newIdx].instructions);
        }
    };

    const prevDraft = () => {
        if (currentDraftIndex > 0) {
            const newIdx = currentDraftIndex - 1;
            setCurrentDraftIndex(newIdx);
            setTone(drafts[newIdx].tone);
            setInstructions(drafts[newIdx].instructions);
        }
    };

    const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const updatedDrafts = [...drafts];
        updatedDrafts[currentDraftIndex].text = e.target.value;
        setDrafts(updatedDrafts);
        saveDraftToDatabase(updatedDrafts);
    };

    const handleSend = async () => {
        const currentDraft = drafts[currentDraftIndex]?.text || '';
        if (!currentDraft.trim()) {
            toast.error('Write your reply first!');
            return;
        }
        if (!selected) return;

        setSending(true);

        const { error } = await supabase
            .from('signals')
            .update({ status: 'engaged' })
            .eq('id', selected.id);

        if (error) {
            toast.error('Failed to send reply');
            setSending(false);
            return;
        }

        try {
            await navigator.clipboard.writeText(currentDraft);
        } catch {
            console.warn("clipboard write failed");
        }

        if (selected.post_url) {
            window.open(selected.post_url, '_blank', 'noopener,noreferrer');
        }

        toast.success('Reply copied! Lead moved to Engaged. ✅');
        setLeads((prev) => prev.filter((l) => l.id !== selected.id));
        setSelected(null);

        setSending(false);
    };

    const p = selected ? (PLATFORM_META[selected.platform] ?? PLATFORM_META.reddit) : null;

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Drafts &amp; Replies</h1>
                <p className="text-sm text-gray-400 mt-0.5">Review your AI-generated drafts and send them out.</p>
            </div>

            {/* Two-pane layout */}
            <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">

                {/* ── Left pane: Lead list ─────────────────────────────────────── */}
                <div className="w-full md:w-[300px] md:shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Awaiting Review</span>
                        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {loading ? '…' : leads.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} />)}

                        {!loading && leads.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center gap-2 px-4">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:inbox-linear" class="text-gray-200 text-3xl" />
                                <p className="text-sm text-gray-400">Inbox is empty.</p>
                            </div>
                        )}

                        {!loading && leads.map((lead) => {
                            const meta = PLATFORM_META[lead.platform] ?? PLATFORM_META.reddit;
                            const isActive = selected?.id === lead.id;
                            return (
                                <button
                                    key={lead.id}
                                    onClick={() => handleSelect(lead)}
                                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors duration-100 ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon={meta.icon} class={`text-sm ${meta.color}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                                            @{lead.author_handle}
                                        </p>
                                        <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-snug">{lead.post_content}</p>
                                    </div>
                                    {isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right pane: Reader & Editor ──────────────────────────────── */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden min-h-[500px] md:min-h-0">

                    {!selected ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-10">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:letter-opened-linear" class="text-gray-300 text-3xl" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Select a lead to review</p>
                            <p className="text-xs text-gray-400 max-w-xs">Your AI-generated draft and the original signal will appear here.</p>
                        </div>
                    ) : (
                        <>
                            {/* Reading pane header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full ${p!.bg} flex items-center justify-center shrink-0`}>
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon={p!.icon} class={`text-lg ${p!.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">@{selected.author_handle}</p>
                                        <p className={`text-xs font-medium ${p!.color}`}>{p!.label}</p>
                                    </div>
                                </div>
                                {selected.post_url && (
                                    <a
                                        href={selected.post_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 rounded-lg px-3 py-1.5 transition-colors"
                                    >
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:arrow-right-up-linear" class="text-sm" />
                                        View Original
                                    </a>
                                )}
                            </div>

                            {/* Original post */}
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Original Signal</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{selected.post_content}</p>
                            </div>

                            {/* 3 ─ Draft Tone */}
                            <div className="px-5 py-3 border-b border-gray-100">
                                <label className="text-xs font-medium text-gray-500 block mb-2">
                                    Draft Tone
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {TONES.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTone(t)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${tone === t
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-800'
                                                }`}
                                        >
                                            {/* @ts-expect-error custom element */}
                                            <iconify-icon icon={toneIcons[t]} class="text-sm"></iconify-icon>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 4 ─ Custom Instructions */}
                            <div className="px-5 py-3 border-b border-gray-100">
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

                            {/* 5 ─ Draft Editor */}
                            <div className="flex-1 flex flex-col px-5 py-4 gap-3 bg-white">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">AI Draft</p>
                                        <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-medium border border-indigo-100">AI-assisted</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {drafts.length > 1 && (
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                                <button
                                                    onClick={prevDraft}
                                                    disabled={currentDraftIndex === 0}
                                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                                >
                                                    {/* @ts-expect-error custom element */}
                                                    <iconify-icon icon="solar:alt-arrow-left-line-duotone" />
                                                </button>
                                                <span>{currentDraftIndex + 1} of {drafts.length}</span>
                                                <button
                                                    onClick={nextDraft}
                                                    disabled={currentDraftIndex === drafts.length - 1}
                                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                                >
                                                    {/* @ts-expect-error custom element */}
                                                    <iconify-icon icon="solar:alt-arrow-right-line-duotone" />
                                                </button>
                                            </div>
                                        )}
                                        {isGenerating && (
                                            <span className="text-[10px] text-indigo-500 flex items-center gap-1 animate-pulse">
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:refresh-linear" class="text-xs animate-spin" />
                                                Generating…
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <textarea
                                    rows={6}
                                    className="flex-1 resize-none w-full text-sm text-gray-700 placeholder-gray-300 bg-[#F9FAFB] border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:border-indigo-500 transition leading-relaxed min-h-[140px]"
                                    value={drafts[currentDraftIndex]?.text || ''}
                                    onChange={handleDraftChange}
                                    placeholder={isGenerating ? "" : `Write or paste your reply to @${selected.author_handle} here…`}
                                    disabled={drafts.length === 0 && !isGenerating}
                                />

                                {/* Char counter logic replicated */}
                                <div className="flex justify-end mt-1">
                                    <span className={`text-xs font-medium tabular-nums flex items-center gap-1 ${(null !== (selected.platform === 'twitter' ? 280 : 500)) && (drafts[currentDraftIndex]?.text || '').length > (selected.platform === 'twitter' ? 280 : 500) ? 'text-red-500' : 'text-gray-500'}`}>
                                        {(drafts[currentDraftIndex]?.text || '').length} / {selected.platform === 'twitter' ? 280 : 500}
                                    </span>
                                </div>
                            </div>

                            {/* Action bar */}
                            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-white shrink-0">
                                <button
                                    onClick={() => { setSelected(null); setDrafts([]); }}
                                    className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    Dismiss
                                </button>

                                {(() => {
                                    switch (selected.status) {
                                        case 'new':
                                        case 'action_required':
                                            return (
                                                <div className="flex w-full sm:w-auto items-center gap-2 justify-end">
                                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar cursor-pointer">
                                                        <button
                                                            onClick={handleGenerate}
                                                            disabled={isGenerating}
                                                            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 shrink-0"
                                                        >
                                                            {/* @ts-expect-error custom element */}
                                                            <iconify-icon icon="solar:refresh-linear" class={`text-sm ${isGenerating ? 'animate-spin' : ''}`} />
                                                            {drafts.length > 0 ? 'Regenerate Draft' : 'Generate Draft'}
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={handleSend}
                                                        disabled={sending || drafts.length === 0 || ((drafts[currentDraftIndex]?.text || '').length > (selected.platform === 'twitter' ? 280 : 500))}
                                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0 transition-all duration-150 shadow-sm"
                                                    >
                                                        {/* @ts-expect-error custom element */}
                                                        <iconify-icon icon={sending ? 'solar:refresh-linear' : 'solar:copy-linear'} class={`text-sm ${sending ? 'animate-spin' : ''}`} />
                                                        {sending ? 'Sending…' : 'Copy & Mark Engaged'}
                                                    </button>
                                                </div>
                                            );
                                        case 'engaged':
                                        default:
                                            return (
                                                <button
                                                    disabled
                                                    className="flex items-center gap-2 bg-emerald-50 text-emerald-600 text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0"
                                                >
                                                    {/* @ts-expect-error custom element */}
                                                    <iconify-icon icon="solar:check-circle-linear" class="text-sm" />
                                                    Sent
                                                </button>
                                            );
                                    }
                                })()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
