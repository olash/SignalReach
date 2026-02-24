'use client';

import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import AIActionPanel from '@/components/AIActionPanel';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/WorkspaceContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'all' | 'reddit' | 'twitter' | 'linkedin';
type SignalStatus = 'new' | 'drafted' | 'replied' | 'dismissed';

interface Signal {
    id: string;
    workspace_id: string;
    platform: 'reddit' | 'twitter' | 'linkedin';
    author_handle: string;
    post_content: string;
    post_url: string | null;
    status: SignalStatus;
    intent_score: string;
    created_at: string;
}

interface PanelProspect {
    id: string;
    platform: 'reddit' | 'twitter' | 'linkedin';
    handle: string;
    originalPost: string;
    postUrl: string | null;
}

// ─── Column configuration ────────────────────────────────────────────────────

const COLUMN_CONFIG: {
    id: SignalStatus;
    title: string;
    icon: string;
    accent: string;
    emptyMsg: string;
    emptySubMsg: string;
    emptyIcon: string;
}[] = [
        {
            id: 'new',
            title: 'New Signals',
            icon: 'solar:radar-linear',
            accent: 'text-indigo-500',
            emptyMsg: 'No signals yet.',
            emptySubMsg: 'Run the scraper to fetch leads from Reddit.',
            emptyIcon: 'solar:radar-linear',
        },
        {
            id: 'drafted',
            title: 'Action Required',
            icon: 'solar:bell-bing-linear',
            accent: 'text-amber-500',
            emptyMsg: 'No drafts pending.',
            emptySubMsg: 'AI replies waiting for your approval will appear here.',
            emptyIcon: 'solar:magic-stick-3-linear',
        },
        {
            id: 'replied',
            title: 'Engaged',
            icon: 'solar:chat-round-dots-linear',
            accent: 'text-emerald-500',
            emptyMsg: 'No engaged leads.',
            emptySubMsg: "Move cards here after you've sent your reply.",
            emptyIcon: 'solar:chat-round-dots-linear',
        },
        {
            id: 'dismissed',
            title: 'Archive / Closed',
            icon: 'solar:archive-linear',
            accent: 'text-gray-400',
            emptyMsg: 'Archive is empty.',
            emptySubMsg: 'Drop cards here to clear your board.',
            emptyIcon: 'solar:archive-linear',
        },
    ];

// ─── Platform metadata ───────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { icon: string; color: string }> = {
    reddit: { icon: 'solar:reddit-linear', color: 'text-orange-500' },
    twitter: { icon: 'solar:twitter-linear', color: 'text-sky-500' },
    linkedin: { icon: 'solar:linkedin-linear', color: 'text-blue-600' },
};

// ─── Platform filter bar ─────────────────────────────────────────────────────

const platformFilters: { id: Platform; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: 'solar:tuning-linear' },
    { id: 'reddit', label: 'Reddit', icon: 'solar:reddit-linear' },
    { id: 'twitter', label: 'Twitter', icon: 'solar:twitter-linear' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'solar:linkedin-linear' },
];

function timeAgo(dateString: string) {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PlatformBadge({ platform, source }: { platform: string; source: string }) {
    const meta = PLATFORM_META[platform] ?? { icon: 'solar:global-linear', color: 'text-gray-400' };
    return (
        <div className="flex items-center gap-1.5">
            {/* @ts-expect-error custom element */}
            <iconify-icon icon={meta.icon} class={`text-base ${meta.color}`} />
            <span className="text-xs text-gray-400 font-medium">{source}</span>
        </div>
    );
}

function ColumnHeader({ title, count, icon, accent }: { title: string; count?: number; icon: string; accent?: string }) {
    return (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                {/* @ts-expect-error custom element */}
                <iconify-icon icon={icon} class={`text-base ${accent ?? 'text-gray-400'}`} />
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            </div>
            {count !== undefined && (
                <span className="text-xs font-semibold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{count}</span>
            )}
        </div>
    );
}

function EmptyColumnState({ icon, msg, subMsg }: { icon: string; msg: string; subMsg: string }) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-white/60 gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                {/* @ts-expect-error custom element */}
                <iconify-icon icon={icon} class="text-gray-400 text-xl" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-700">{msg}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[180px]">{subMsg}</p>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded-full" />
                    <div className="w-24 h-3 bg-gray-200 rounded" />
                </div>
                <div className="w-10 h-3 bg-gray-100 rounded" />
            </div>
            <div className="space-y-1.5">
                <div className="w-full h-3 bg-gray-100 rounded" />
                <div className="w-5/6 h-3 bg-gray-100 rounded" />
                <div className="w-4/6 h-3 bg-gray-100 rounded" />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                <div className="w-12 h-3 bg-gray-100 rounded" />
                <div className="w-24 h-6 bg-gray-100 rounded-lg" />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { activeWorkspace } = useWorkspace();
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<Platform>('all');
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelProspect, setPanelProspect] = useState<PanelProspect | undefined>();

    // ── Data fetching ──────────────────────────────────────────────────────────
    const fetchSignals = useCallback(async () => {
        if (!activeWorkspace) { setLoading(false); return; }
        setLoading(true);
        try {
            const { data: rows, error: signalsErr } = await supabase
                .from('signals')
                .select('id, workspace_id, platform, author_handle, post_content, post_url, status, intent_score, created_at')
                .eq('workspace_id', activeWorkspace.id)
                .order('created_at', { ascending: false });

            if (signalsErr) {
                toast.error('Failed to load signals.');
                console.error('[Dashboard] signals fetch error:', signalsErr.message);
                return;
            }

            setSignals((rows ?? []) as Signal[]);
        } catch (err) {
            console.error('[Dashboard] unexpected error:', err);
            toast.error('Something went wrong loading your board.');
        } finally {
            setLoading(false);
        }
    }, [activeWorkspace]);

    useEffect(() => { fetchSignals(); }, [fetchSignals]);

    // ── Open AI panel ──────────────────────────────────────────────────────────
    const openPanel = (signal: Signal) => {
        setPanelProspect({
            id: signal.id,
            platform: signal.platform,
            handle: `@${signal.author_handle}`,
            originalPost: signal.post_content,
            postUrl: signal.post_url
        });
        setPanelOpen(true);
    };

    // ── Drag-and-drop handler ─────────────────────────────────────────────────
    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination || source.droppableId === destination.droppableId) return;

        const newStatus = destination.droppableId as SignalStatus;
        const signalId = draggableId;

        const snapshot = signals;

        setSignals((prev) =>
            prev.map((s) => (s.id === signalId ? { ...s, status: newStatus } : s))
        );

        const { error } = await supabase
            .from('signals')
            .update({ status: newStatus })
            .eq('id', signalId);

        if (error) {
            setSignals(snapshot);
            toast.error('Could not update signal status. Please try again.');
            console.error('[Dashboard] status update error:', error.message);
        } else {
            toast.success(`Moved to ${COLUMN_CONFIG.find(c => c.id === newStatus)?.title ?? newStatus}`);
        }
    };

    // ── Derived columns ────────────────────────────────────────────────────────
    const byStatus = (status: SignalStatus) =>
        signals.filter((s) => s.status === status);

    const filteredNew = () =>
        byStatus('new').filter(
            (l) => activeFilter === 'all' || l.platform === activeFilter
        );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-5 h-full">

            {/* ── AI Action Panel ─────────────────────────────────────────────── */}
            <AIActionPanel
                isOpen={panelOpen}
                onClose={(statusUpdated?: boolean) => {
                    setPanelOpen(false);
                    if (statusUpdated) {
                        fetchSignals();
                    }
                }}
                prospect={panelProspect}
            />

            {/* ── Top Control Bar ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-wrap">
                    {platformFilters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeFilter === f.id
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon={f.icon} class="text-sm" />
                            {f.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => toast('Keyword management coming soon!', { icon: '⚙️' })}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 border border-indigo-100"
                >
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:settings-linear" class="text-base" />
                    Manage Keywords
                </button>
            </div>

            {/* ── Kanban Board ─────────────────────────────────────────────────── */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex flex-col md:flex-row md:overflow-x-auto gap-4 pb-4 flex-1 md:items-start">

                    {/* ── Column: New Signals ─────────────────────────────────────── */}
                    <div className="w-full md:w-80 md:shrink-0 bg-gray-50 rounded-xl p-3 flex flex-col gap-2.5">
                        <ColumnHeader
                            title="New Signals"
                            count={loading ? undefined : filteredNew().length}
                            icon="solar:radar-linear"
                            accent="text-indigo-500"
                        />

                        {/* Skeleton while loading */}
                        {loading && (
                            <div className="flex flex-col gap-2.5">
                                <SkeletonCard />
                                <SkeletonCard />
                            </div>
                        )}

                        {!loading && (
                            <Droppable droppableId="new">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex flex-col gap-2.5 min-h-[60px] rounded-xl transition-colors duration-150 ${snapshot.isDraggingOver ? 'bg-indigo-50/60' : ''
                                            }`}
                                    >
                                        {filteredNew().length === 0 && !snapshot.isDraggingOver && (
                                            <EmptyColumnState
                                                icon="solar:radar-linear"
                                                msg="No signals yet."
                                                subMsg="Run the scraper to fetch leads from Reddit."
                                            />
                                        )}

                                        {filteredNew().map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(drag, dragSnapshot) => (
                                                    <div
                                                        ref={drag.innerRef}
                                                        {...drag.draggableProps}
                                                        {...drag.dragHandleProps}
                                                        className={`group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing ${dragSnapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-300 rotate-1' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <PlatformBadge platform={lead.platform} source={`@${lead.author_handle}`} />
                                                            {lead.post_url && (
                                                                <a
                                                                    href={lead.post_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-gray-300 hover:text-indigo-500 transition-colors"
                                                                    title="View original post"
                                                                >
                                                                    {/* @ts-expect-error custom element */}
                                                                    <iconify-icon icon="solar:arrow-right-up-linear" class="text-base" />
                                                                </a>
                                                            )}
                                                        </div>

                                                        <p className="text-sm text-gray-700 leading-snug line-clamp-3">
                                                            {lead.post_content}
                                                        </p>

                                                        <div className="flex items-center justify-between pt-2">
                                                            <div className="flex items-center gap-2">
                                                                {/* Dynamic Intent Tag */}
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${lead.intent_score?.toLowerCase() === 'hot'
                                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                                        : 'bg-amber-50 text-amber-600 border-amber-200'
                                                                    }`}>
                                                                    {lead.intent_score || 'Warm'}
                                                                </span>
                                                                {/* Dynamic Time Ago */}
                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                    {timeAgo(lead.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                                                            <span className="text-[10px] text-gray-400 font-medium capitalize">{lead.platform}</span>
                                                            <button
                                                                onClick={() => openPanel(lead)}
                                                                className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 px-2.5 py-1.5 rounded-lg transition-all duration-150"
                                                            >
                                                                {/* @ts-expect-error custom element */}
                                                                <iconify-icon icon="solar:magic-stick-3-linear" class="text-sm" />
                                                                Generate AI Draft
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {/* Static paywall card — always visible as upgrade prompt */}
                                        <div className="relative rounded-xl border border-gray-200 bg-white overflow-hidden">
                                            <div className="p-4 blur-sm select-none opacity-60 pointer-events-none">
                                                <PlatformBadge platform="linkedin" source="LinkedIn Post" />
                                                <p className="mt-2 text-sm text-gray-700 leading-snug line-clamp-2">
                                                    &ldquo;Our sales team is evaluating new prospecting tools this quarter…&rdquo;
                                                </p>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-600 border-amber-200">Warm</span>
                                                    <span className="text-[10px] text-gray-400">34 min ago</span>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] px-4 text-center gap-2">
                                                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                                                    {/* @ts-expect-error custom element */}
                                                    <iconify-icon icon="solar:lock-linear" class="text-indigo-500 text-lg" />
                                                </div>
                                                <p className="text-xs font-medium text-gray-700">
                                                    <button
                                                        onClick={() => toast('🚀 Upgrade to Pro to unlock 45+ more signals!', { icon: '✨' })}
                                                        className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2 transition-colors"
                                                    >
                                                        Upgrade to Pro
                                                    </button>{' '}
                                                    to unlock 45 more signals.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        )}
                    </div>

                    {/* ── Column: Action Required (drafted) ──────────────────────── */}
                    <div className="w-full md:w-80 md:shrink-0 bg-gray-50 rounded-xl p-3 flex flex-col gap-2.5">
                        <ColumnHeader
                            title="Action Required"
                            count={loading ? undefined : byStatus('drafted').length}
                            icon="solar:bell-bing-linear"
                            accent="text-amber-500"
                        />

                        {loading && (
                            <div className="flex flex-col gap-2.5"><SkeletonCard /></div>
                        )}

                        {!loading && (
                            <Droppable droppableId="drafted">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex flex-col gap-2.5 min-h-[60px] rounded-xl transition-colors duration-150 ${snapshot.isDraggingOver ? 'bg-amber-50/60' : ''
                                            }`}
                                    >
                                        {byStatus('drafted').length === 0 && !snapshot.isDraggingOver && (
                                            <EmptyColumnState
                                                icon="solar:magic-stick-3-linear"
                                                msg="No drafts pending."
                                                subMsg="AI replies waiting for your approval will appear here."
                                            />
                                        )}

                                        {byStatus('drafted').map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(drag, dragSnapshot) => (
                                                    <div
                                                        ref={drag.innerRef}
                                                        {...drag.draggableProps}
                                                        {...drag.dragHandleProps}
                                                        className={`group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing ${dragSnapshot.isDragging ? 'shadow-lg ring-2 ring-amber-300 rotate-1' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <PlatformBadge platform={lead.platform} source={`@${lead.author_handle}`} />
                                                            {lead.post_url && (
                                                                <a
                                                                    href={lead.post_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-gray-300 hover:text-indigo-500 transition-colors"
                                                                >
                                                                    {/* @ts-expect-error custom element */}
                                                                    <iconify-icon icon="solar:arrow-right-up-linear" class="text-base" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-snug line-clamp-3">{lead.post_content}</p>

                                                        <div className="flex items-center justify-between pt-2">
                                                            <div className="flex items-center gap-2">
                                                                {/* Dynamic Intent Tag */}
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${lead.intent_score?.toLowerCase() === 'hot'
                                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                                        : 'bg-amber-50 text-amber-600 border-amber-200'
                                                                    }`}>
                                                                    {lead.intent_score || 'Warm'}
                                                                </span>
                                                                {/* Dynamic Time Ago */}
                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                    {timeAgo(lead.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                                                            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Draft ready</span>
                                                            <button
                                                                onClick={() => openPanel(lead)}
                                                                className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 px-2.5 py-1.5 rounded-lg transition-all duration-150"
                                                            >
                                                                {/* @ts-expect-error custom element */}
                                                                <iconify-icon icon="solar:magic-stick-3-linear" class="text-sm" />
                                                                Review Draft
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        )}
                    </div>

                    {/* ── Column: Engaged (replied) ───────────────────────────────── */}
                    <div className="w-full md:w-80 md:shrink-0 bg-gray-50 rounded-xl p-3 flex flex-col gap-2.5">
                        <ColumnHeader
                            title="Engaged"
                            count={loading ? undefined : byStatus('replied').length}
                            icon="solar:chat-round-dots-linear"
                            accent="text-emerald-500"
                        />

                        {loading && (
                            <div className="flex flex-col gap-2.5"><SkeletonCard /></div>
                        )}

                        {!loading && (
                            <Droppable droppableId="replied">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex flex-col gap-2.5 min-h-[60px] rounded-xl transition-colors duration-150 ${snapshot.isDraggingOver ? 'bg-emerald-50/60' : ''
                                            }`}
                                    >
                                        {byStatus('replied').length === 0 && !snapshot.isDraggingOver && (
                                            <EmptyColumnState
                                                icon="solar:chat-round-dots-linear"
                                                msg="No engaged leads."
                                                subMsg="Move cards here after you've sent your reply."
                                            />
                                        )}

                                        {byStatus('replied').map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(drag, dragSnapshot) => (
                                                    <div
                                                        ref={drag.innerRef}
                                                        {...drag.draggableProps}
                                                        {...drag.dragHandleProps}
                                                        className={`group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing ${dragSnapshot.isDragging ? 'shadow-lg ring-2 ring-emerald-300 rotate-1' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <PlatformBadge platform={lead.platform} source={`@${lead.author_handle}`} />
                                                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Replied</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-snug line-clamp-3 italic">{lead.post_content}</p>

                                                        <div className="flex items-center justify-between pt-2">
                                                            <div className="flex items-center gap-2">
                                                                {/* Dynamic Intent Tag */}
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${lead.intent_score?.toLowerCase() === 'hot'
                                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                                        : 'bg-amber-50 text-amber-600 border-amber-200'
                                                                    }`}>
                                                                    {lead.intent_score || 'Warm'}
                                                                </span>
                                                                {/* Dynamic Time Ago */}
                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                    {timeAgo(lead.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                                                            {lead.post_url && (
                                                                <a
                                                                    href={lead.post_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95 py-1.5 rounded-lg transition-all duration-150"
                                                                >
                                                                    {/* @ts-expect-error custom element */}
                                                                    <iconify-icon icon="solar:arrow-right-up-linear" class="text-sm" />
                                                                    View Thread
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => openPanel(lead)}
                                                                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 py-1.5 rounded-lg transition-all duration-150"
                                                            >
                                                                {/* @ts-expect-error custom element */}
                                                                <iconify-icon icon="solar:magic-stick-3-linear" class="text-sm" />
                                                                AI Follow-up
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        )}
                    </div>

                    {/* ── Column: Archive / Closed (dismissed) ────────────────────── */}
                    <div className="w-full md:w-80 md:shrink-0 bg-gray-50/60 rounded-xl p-3 flex flex-col gap-2.5 border border-dashed border-gray-200">
                        <ColumnHeader
                            title="Archive / Closed"
                            count={loading ? undefined : byStatus('dismissed').length}
                            icon="solar:archive-linear"
                            accent="text-gray-400"
                        />
                        <p className="text-[10px] text-gray-400 text-center py-1">Drop cards here to clear your board</p>

                        {loading && (
                            <div className="flex flex-col gap-2.5"><SkeletonCard /></div>
                        )}

                        {!loading && (
                            <Droppable droppableId="dismissed">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex flex-col gap-2.5 min-h-[60px] rounded-xl transition-colors duration-150 ${snapshot.isDraggingOver ? 'bg-gray-100/80' : ''
                                            }`}
                                    >
                                        {byStatus('dismissed').length === 0 && !snapshot.isDraggingOver && (
                                            <div className="border border-dashed border-gray-200 rounded-lg py-5 flex flex-col items-center gap-1.5 text-gray-300">
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:add-circle-linear" class="text-2xl" />
                                                <span className="text-xs">Drop a card here</span>
                                            </div>
                                        )}

                                        {byStatus('dismissed').map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(drag, dragSnapshot) => (
                                                    <div
                                                        ref={drag.innerRef}
                                                        {...drag.draggableProps}
                                                        {...drag.dragHandleProps}
                                                        className={`bg-white/70 rounded-xl border border-gray-100 p-3.5 flex flex-col gap-2 opacity-60 cursor-grab active:cursor-grabbing ${dragSnapshot.isDragging ? 'opacity-100 shadow-lg' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            {/* @ts-expect-error custom element */}
                                                            <iconify-icon icon="solar:archive-down-linear" class="text-gray-300 text-sm" />
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Closed</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 italic leading-snug line-clamp-2">{lead.post_content}</p>
                                                        <span className="text-[10px] text-gray-300">{lead.platform}</span>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        )}
                    </div>

                </div>
            </DragDropContext>
        </div>
    );
}
