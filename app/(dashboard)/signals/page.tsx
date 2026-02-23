'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'reddit' | 'twitter' | 'linkedin';
type LeadStatus = 'new' | 'drafted' | 'replied' | 'dismissed';

interface Lead {
    id: string;
    platform: Platform;
    author_handle: string;
    post_content: string;
    post_url: string | null;
    status: LeadStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<Platform, { icon: string; color: string; label: string }> = {
    reddit: { icon: 'solar:reddit-linear', color: 'text-orange-500', label: 'Reddit' },
    twitter: { icon: 'solar:twitter-linear', color: 'text-sky-500', label: 'Twitter' },
    linkedin: { icon: 'solar:linkedin-linear', color: 'text-blue-600', label: 'LinkedIn' },
};

const STATUS_META: Record<LeadStatus, { label: string; cls: string }> = {
    new: { label: 'New', cls: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    drafted: { label: 'Drafted', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    replied: { label: 'Replied', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    dismissed: { label: 'Closed', cls: 'bg-gray-100 text-gray-400 border-gray-200' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <div className="flex items-start gap-4 px-5 py-4 animate-pulse border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2 pt-1">
                <div className="flex items-center gap-3">
                    <div className="w-28 h-3 bg-gray-200 rounded" />
                    <div className="w-14 h-3 bg-gray-100 rounded" />
                </div>
                <div className="w-full h-3 bg-gray-100 rounded" />
                <div className="w-4/5 h-3 bg-gray-100 rounded" />
            </div>
            <div className="w-16 h-5 bg-gray-100 rounded-full shrink-0 mt-1" />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SignalsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

        if (!workspaces?.length) { setLoading(false); return; }

        const { data, error } = await supabase
            .from('leads')
            .select('id, platform, author_handle, post_content, post_url, status')
            .eq('workspace_id', workspaces[0].id)
            .order('id', { ascending: false });

        if (error) toast.error('Failed to load signals.');
        else setLeads((data ?? []) as Lead[]);
        setLoading(false);
    }, []);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const filtered = leads.filter((l) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            l.author_handle.toLowerCase().includes(q) ||
            l.post_content.toLowerCase().includes(q) ||
            l.platform.toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Signal Feed</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Every raw lead from your scrapers, in one place.</p>
                </div>
                <button
                    onClick={fetchLeads}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 px-4 py-2 rounded-full border border-indigo-100 transition-all duration-150"
                >
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:refresh-linear" class="text-base" />
                    Refresh
                </button>
            </div>

            {/* Search bar */}
            <div className="relative">
                {/* @ts-expect-error custom element */}
                <iconify-icon
                    icon="solar:magnifer-linear"
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"
                />
                <input
                    type="text"
                    placeholder="Search by handle, keyword, or platform…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition shadow-sm"
                />
            </div>

            {/* Feed table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Column headers */}
                <div className="hidden sm:grid grid-cols-[2fr_3fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/70">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Author</span>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Signal</span>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</span>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Link</span>
                </div>

                {loading && (
                    <div>
                        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:radar-linear" class="text-gray-300 text-2xl" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            {search ? 'No signals match your search.' : 'No signals yet.'}
                        </p>
                        <p className="text-xs text-gray-400 max-w-xs">
                            {search ? 'Try a different keyword.' : 'Run your first scraper job to start seeing leads here.'}
                        </p>
                    </div>
                )}

                {!loading && filtered.map((lead) => {
                    const p = PLATFORM_META[lead.platform] ?? PLATFORM_META.reddit;
                    const s = STATUS_META[lead.status] ?? STATUS_META.new;
                    return (
                        <div
                            key={lead.id}
                            className="group grid sm:grid-cols-[2fr_3fr_1fr_auto] grid-cols-1 gap-4 items-start px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors duration-150"
                        >
                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0`}>
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon={p.icon} class={`text-base ${p.color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">@{lead.author_handle}</p>
                                    <p className={`text-[11px] font-medium ${p.color}`}>{p.label}</p>
                                </div>
                            </div>

                            {/* Content */}
                            <p className="text-sm text-gray-600 leading-snug line-clamp-2 sm:line-clamp-2">{lead.post_content}</p>

                            {/* Status */}
                            <div className="flex items-center">
                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                            </div>

                            {/* Link */}
                            <div className="flex items-center">
                                {lead.post_url ? (
                                    <a
                                        href={lead.post_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                                        title="View original post"
                                    >
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:arrow-right-up-linear" class="text-base" />
                                    </a>
                                ) : (
                                    <span className="w-8 h-8 flex items-center justify-center">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:slash-circle-linear" class="text-gray-200 text-base" />
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer count */}
            {!loading && (
                <p className="text-xs text-gray-400 text-center">
                    Showing <span className="font-medium text-gray-600">{filtered.length}</span> of <span className="font-medium text-gray-600">{leads.length}</span> signals
                </p>
            )}
        </div>
    );
}
