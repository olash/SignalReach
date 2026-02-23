'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import AIActionPanel from '@/components/AIActionPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'all' | 'reddit' | 'twitter' | 'linkedin';

interface Signal {
    id: string;
    platform: 'reddit' | 'twitter' | 'linkedin';
    platformIcon: string;
    platformColor: string;
    source: string;
    excerpt: string;
    intent: 'hot' | 'warm';
    score: number;
    timeAgo: string;
    blurred?: boolean;
}

interface EngagedCard {
    id: string;
    platform: 'reddit' | 'twitter' | 'linkedin';
    platformIcon: string;
    platformColor: string;
    source: string;
    excerpt: string;
    replies: number;
    timeAgo: string;
    status: string;
}

interface PanelProspect {
    platform: 'reddit' | 'twitter' | 'linkedin';
    handle: string;
    originalPost: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const NEW_SIGNALS: Signal[] = [
    {
        id: 's1', platform: 'reddit', platformIcon: 'solar:reddit-linear', platformColor: 'text-orange-500',
        source: 'r/SaaS',
        excerpt: '"Looking for alternatives to generic CRMs for my sales team — any recommendations that track intent?"',
        intent: 'hot', score: 97, timeAgo: '2 min ago',
    },
    {
        id: 's2', platform: 'twitter', platformIcon: 'solar:twitter-linear', platformColor: 'text-sky-500',
        source: '@founder_mikk',
        excerpt: '"Tired of cold email tools that just spray-and-pray. Is there a better way to find buyers who are already looking?"',
        intent: 'warm', score: 83, timeAgo: '11 min ago',
    },
    {
        id: 's3', platform: 'linkedin', platformIcon: 'solar:linkedin-linear', platformColor: 'text-blue-600',
        source: 'LinkedIn Post',
        excerpt: '"Our sales team is evaluating new prospecting tools this quarter. Would love to hear what\'s working."',
        intent: 'warm', score: 71, timeAgo: '34 min ago', blurred: true,
    },
];

const ENGAGED_CARDS: EngagedCard[] = [
    {
        id: 'e1', platform: 'reddit', platformIcon: 'solar:reddit-linear', platformColor: 'text-orange-500',
        source: 'r/Entrepreneur',
        excerpt: '"Great point! We actually built SignalReach to solve exactly this — tracking intent without the spam."',
        replies: 3, timeAgo: '1 hr ago', status: 'Awaiting reply',
    },
];

const ARCHIVE_CARDS = [
    { id: 'a1', excerpt: '"Found a solution, thanks everyone!"', timeAgo: '2 days ago' },
    { id: 'a2', excerpt: '"Already went with a competitor, but bookmarked this."', timeAgo: '4 days ago' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const intentConfig = {
    hot: { label: 'Hot', cls: 'bg-red-100 text-red-600 border-red-200' },
    warm: { label: 'Warm', cls: 'bg-amber-100 text-amber-600 border-amber-200' },
};

const platformFilters: { id: Platform; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: 'solar:tuning-linear' },
    { id: 'reddit', label: 'Reddit', icon: 'solar:reddit-linear' },
    { id: 'twitter', label: 'Twitter', icon: 'solar:twitter-linear' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'solar:linkedin-linear' },
];

function PlatformBadge({ icon, color, source }: { icon: string; color: string; source: string }) {
    return (
        <div className="flex items-center gap-1.5">
            {/* @ts-expect-error custom element */}
            <iconify-icon icon={icon} class={`text-base ${color}`} />
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [activeFilter, setActiveFilter] = useState<Platform>('all');
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelProspect, setPanelProspect] = useState<PanelProspect | undefined>();

    const openPanel = (signal: Signal) => {
        setPanelProspect({
            platform: signal.platform,
            handle: signal.source,
            originalPost: signal.excerpt.replace(/"/g, ''),
        });
        setPanelOpen(true);
    };

    return (
        <div className="flex flex-col gap-5 h-full">

            {/* ── AI Action Panel ───────────────────────────────────────────────── */}
            <AIActionPanel
                isOpen={panelOpen}
                onClose={() => setPanelOpen(false)}
                prospect={panelProspect}
            />

            {/* ── Top Control Bar ───────────────────────────────────────────────── */}
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

            {/* ── Kanban Board ──────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:overflow-x-auto gap-4 pb-4 flex-1 md:items-start">

                {/* ── Column 1: New Signals ──────────────────────────────────────── */}
                <div className="w-full md:w-80 md:shrink-0 bg-gray-50 rounded-xl p-3 flex flex-col gap-2.5">
                    <ColumnHeader title="New Signals" count={NEW_SIGNALS.filter(s => !s.blurred && (activeFilter === 'all' || s.platform === activeFilter)).length + 1} icon="solar:radar-linear" accent="text-indigo-500" />

                    <div className="flex flex-col gap-2.5">
                        {NEW_SIGNALS.map((signal) => {
                            const intent = intentConfig[signal.intent];
                            const isFiltered = !signal.blurred && activeFilter !== 'all' && signal.platform !== activeFilter;

                            if (signal.blurred) {
                                return (
                                    <div key={signal.id} className="relative rounded-xl border border-gray-200 bg-white overflow-hidden">
                                        <div className="p-4 blur-sm select-none opacity-60 pointer-events-none">
                                            <PlatformBadge icon={signal.platformIcon} color={signal.platformColor} source={signal.source} />
                                            <p className="mt-2 text-sm text-gray-700 leading-snug line-clamp-2">{signal.excerpt}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${intent.cls}`}>{intent.label}</span>
                                                <span className="text-[10px] text-gray-400">{signal.timeAgo}</span>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] px-4 text-center gap-2">
                                            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:lock-linear" class="text-indigo-500 text-lg" />
                                            </div>
                                            <p className="text-xs font-medium text-gray-700">
                                                <button onClick={() => toast('🚀 Upgrade to Pro to unlock 45+ more signals!', { icon: '✨' })} className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2 transition-colors">
                                                    Upgrade to Pro
                                                </button>{' '}to unlock 45 more signals.
                                            </p>
                                        </div>
                                    </div>
                                );
                            }

                            if (isFiltered) return null;

                            return (
                                <div key={signal.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <PlatformBadge icon={signal.platformIcon} color={signal.platformColor} source={signal.source} />
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${intent.cls}`}>{intent.label}</span>
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{signal.score}%</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-snug line-clamp-3">{signal.excerpt}</p>
                                    <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                                        <span className="text-[10px] text-gray-400">{signal.timeAgo}</span>
                                        <button
                                            onClick={() => openPanel(signal)}
                                            className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 px-2.5 py-1.5 rounded-lg transition-all duration-150"
                                        >
                                            {/* @ts-expect-error custom element */}
                                            <iconify-icon icon="solar:magic-stick-3-linear" class="text-sm" />
                                            Generate AI Draft
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Column 2: Action Required ──────────────────────────────────── */}
                <div className="w-full md:w-80 md:shrink-0 bg-gray-50 rounded-xl p-3 flex flex-col gap-2.5">
                    <ColumnHeader title="Action Required" count={0} icon="solar:bell-bing-linear" accent="text-amber-500" />
                    <div className="flex flex-col items-center justify-center text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-white/60 gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:magic-stick-3-linear" class="text-gray-400 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">No drafts pending.</p>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[180px]">AI replies waiting for your approval will appear here.</p>
                        </div>
                    </div>
                </div>

                {/* ── Column 3: Engaged ──────────────────────────────────────────── */}
                <div className="w-full md:w-80 md:shrink-0 bg-gray-50 rounded-xl p-3 flex flex-col gap-2.5">
                    <ColumnHeader title="Engaged" count={ENGAGED_CARDS.length} icon="solar:chat-round-dots-linear" accent="text-emerald-500" />
                    {ENGAGED_CARDS.map((card) => (
                        <div key={card.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <PlatformBadge icon={card.platformIcon} color={card.platformColor} source={card.source} />
                                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{card.status}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-snug line-clamp-3 italic">{card.excerpt}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:chat-round-linear" class="text-xs" />
                                {card.replies} replies &nbsp;·&nbsp; {card.timeAgo}
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                                <button onClick={() => toast('Opening thread…', { icon: '💬' })} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95 py-1.5 rounded-lg transition-all duration-150">
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:arrow-right-up-linear" class="text-sm" />
                                    View Thread
                                </button>
                                <button onClick={() => toast.success('AI follow-up generated!', { icon: '✨' })} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 py-1.5 rounded-lg transition-all duration-150">
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:magic-stick-3-linear" class="text-sm" />
                                    AI Follow-up
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Column 4: Archive / Closed ─────────────────────────────────── */}
                <div className="w-full md:w-80 md:shrink-0 bg-gray-50/60 rounded-xl p-3 flex flex-col gap-2.5 border border-dashed border-gray-200">
                    <ColumnHeader title="Archive / Closed" count={ARCHIVE_CARDS.length} icon="solar:archive-linear" accent="text-gray-400" />
                    <p className="text-[10px] text-gray-400 text-center py-1">Drop cards here to clear your board</p>
                    {ARCHIVE_CARDS.map((card) => (
                        <div key={card.id} className="bg-white/70 rounded-xl border border-gray-100 p-3.5 flex flex-col gap-2 opacity-60">
                            <div className="flex items-center gap-1.5">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:archive-down-linear" class="text-gray-300 text-sm" />
                                <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Closed</span>
                            </div>
                            <p className="text-sm text-gray-500 italic leading-snug line-clamp-2">{card.excerpt}</p>
                            <span className="text-[10px] text-gray-300">{card.timeAgo}</span>
                        </div>
                    ))}
                    <div className="mt-1 border border-dashed border-gray-200 rounded-lg py-5 flex flex-col items-center gap-1.5 text-gray-300">
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="solar:add-circle-linear" class="text-2xl" />
                        <span className="text-xs">Drop a card here</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
