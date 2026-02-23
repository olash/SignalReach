'use client';

import { useEffect, useState, useCallback, KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import { useWorkspace } from '@/components/WorkspaceContext';

type Tab = 'Account' | 'Profiles' | 'Integrations' | 'Billing';
type Frequency = '6h' | '24h' | '7d';

const TABS: Tab[] = ['Account', 'Profiles', 'Integrations', 'Billing'];
const FREQ_OPTS: { value: Frequency; label: string; desc: string }[] = [
    { value: '6h', label: 'Every 6 hours', desc: 'Active campaigns' },
    { value: '24h', label: 'Daily', desc: 'Recommended' },
    { value: '7d', label: 'Weekly', desc: 'Light monitoring' },
];

const inputCls =
    'w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-indigo-500 transition';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

export default function SettingsPage() {
    const { user } = useAuth();
    const { activeWorkspace } = useWorkspace();
    const [tab, setTab] = useState<Tab>('Account');

    // Account
    const email = user?.email ?? '';
    const [name, setName] = useState('');
    const [origName, setOrigName] = useState('');
    const [savingName, setSavingName] = useState(false);

    // Profiles
    const [twitter, setTwitter] = useState('');
    const [reddit, setReddit] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [savingProfiles, setSavingProfiles] = useState(false);
    const [loadingProfiles, setLoadingProfiles] = useState(true);

    // Integrations
    const [keywords, setKeywords] = useState<string[]>([]);
    const [kwInput, setKwInput] = useState('');
    const [freq, setFreq] = useState<Frequency>('24h');
    const [savingInt, setSavingInt] = useState(false);
    const [loadingInt, setLoadingInt] = useState(true);

    useEffect(() => {
        const n = (user?.user_metadata?.full_name as string | undefined) ?? '';
        setName(n); setOrigName(n);
    }, [user]);

    const fetchProfiles = useCallback(async () => {
        if (!user) return;
        setLoadingProfiles(true);
        const { data } = await supabase.from('social_profiles').select('platform,handle').eq('user_id', user.id);
        if (data) {
            data.forEach((r: { platform: string; handle: string }) => {
                if (r.platform === 'twitter') setTwitter(r.handle);
                if (r.platform === 'reddit') setReddit(r.handle);
                if (r.platform === 'linkedin') setLinkedin(r.handle);
            });
        }
        setLoadingProfiles(false);
    }, [user]);

    const fetchInt = useCallback(async () => {
        if (!activeWorkspace) { setLoadingInt(false); return; }
        setLoadingInt(true);
        if (activeWorkspace.keywords) setKeywords(activeWorkspace.keywords.split(',').map((k: string) => k.trim()).filter(Boolean));
        if (activeWorkspace.scrape_frequency) setFreq(activeWorkspace.scrape_frequency as Frequency);
        setLoadingInt(false);
    }, [activeWorkspace]);

    useEffect(() => { fetchProfiles(); }, [fetchProfiles]);
    useEffect(() => { fetchInt(); }, [fetchInt]);

    const saveName = async () => {
        if (!name.trim()) return;
        setSavingName(true);
        const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
        if (error) toast.error('Failed to update name.'); else { setOrigName(name.trim()); toast.success('Name updated!'); }
        setSavingName(false);
    };

    const saveProfiles = async () => {
        if (!user) return;
        setSavingProfiles(true);
        const rows = [
            { platform: 'twitter', handle: twitter.trim() },
            { platform: 'reddit', handle: reddit.trim() },
            { platform: 'linkedin', handle: linkedin.trim() },
        ].filter(p => p.handle);
        const results = await Promise.all(rows.map(p =>
            supabase.from('social_profiles').upsert({ user_id: user.id, platform: p.platform, handle: p.handle }, { onConflict: 'user_id, platform' })
        ));
        const failed = results.find(r => r.error);
        if (failed?.error) toast.error('Failed to save profiles.'); else toast.success('Social profiles saved!');
        setSavingProfiles(false);
    };

    const addKw = () => {
        const v = kwInput.trim();
        if (!v || keywords.includes(v)) { setKwInput(''); return; }
        if (keywords.length >= 20) { toast.error('Max 20 keywords.'); return; }
        setKeywords(p => [...p, v]); setKwInput('');
    };
    const onKwKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKw(); }
        else if (e.key === 'Backspace' && !kwInput) setKeywords(p => p.slice(0, -1));
    };

    const saveInt = async () => {
        if (!activeWorkspace) { toast.error('No workspace found.'); return; }
        setSavingInt(true);
        const { error } = await supabase
            .from('workspaces')
            .update({ keywords: keywords.join(', '), scrape_frequency: freq })
            .eq('id', activeWorkspace.id);
        if (error) toast.error('Failed to save.'); else toast.success('Integration settings saved!');
        setSavingInt(false);
    };

    const SaveBtn = ({ onClick, busy, disabled, label, busyLabel }: {
        onClick: () => void; busy: boolean; disabled?: boolean; label: string; busyLabel: string;
    }) => (
        <div className="flex justify-end">
            <button onClick={onClick} disabled={busy || disabled}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl shadow-sm transition-all">
                {/* @ts-expect-error custom element */}
                <iconify-icon icon={busy ? 'solar:refresh-linear' : 'solar:diskette-linear'} class={`text-base ${busy ? 'animate-spin' : ''}`} />
                {busy ? busyLabel : label}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-sm text-gray-400 mt-0.5">Manage your account, profiles, and integrations.</p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center border-b border-gray-200 gap-1">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* ── ACCOUNT ── */}
            {tab === 'Account' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-5">
                    <div>
                        <label className={labelCls}>Email Address <span className="normal-case text-gray-400 font-normal">(cannot be changed)</span></label>
                        <input type="email" disabled value={email} className="w-full text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 cursor-not-allowed opacity-50" />
                    </div>
                    <div>
                        <label className={labelCls}>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputCls} />
                    </div>
                    <SaveBtn onClick={saveName} busy={savingName} disabled={name.trim() === origName} label="Save Name" busyLabel="Saving…" />
                </div>
            )}

            {/* ── PROFILES ── */}
            {tab === 'Profiles' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-5">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:user-circle-linear" class="text-sky-500 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Social Handles</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Used for monitoring your brand presence.</p>
                        </div>
                    </div>
                    {loadingProfiles ? (
                        <div className="space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}</div>
                    ) : (
                        <>
                            <div>
                                <label className={labelCls}>Twitter / X Handle</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">@</span>
                                    <input type="text" placeholder="yourhandle" value={twitter} onChange={e => setTwitter(e.target.value)} className={`${inputCls} pl-8`} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Reddit Username</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">u/</span>
                                    <input type="text" placeholder="yourusername" value={reddit} onChange={e => setReddit(e.target.value)} className={`${inputCls} pl-10`} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>LinkedIn URL</label>
                                <input type="url" placeholder="https://linkedin.com/in/you" value={linkedin} onChange={e => setLinkedin(e.target.value)} className={inputCls} />
                            </div>
                            <SaveBtn onClick={saveProfiles} busy={savingProfiles} label="Save Profiles" busyLabel="Saving…" />
                        </>
                    )}
                </div>
            )}

            {/* ── INTEGRATIONS ── */}
            {tab === 'Integrations' && (
                <>
                    {loadingInt ? (
                        <div className="flex flex-col gap-4 animate-pulse">{[1, 2].map(i => <div key={i} className="h-32 bg-white border border-gray-200 rounded-xl" />)}</div>
                    ) : (
                        <>
                            {/* Keywords */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:magnifer-zoom-in-linear" class="text-indigo-500 text-lg" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-900">Target Keywords</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">Press <kbd className="bg-gray-100 text-[10px] px-1 py-0.5 rounded font-mono">Enter</kbd> or <kbd className="bg-gray-100 text-[10px] px-1 py-0.5 rounded font-mono">,</kbd> to add.</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[52px] focus-within:ring-2 focus-within:border-indigo-500 transition cursor-text"
                                    onClick={() => document.getElementById('kw-input')?.focus()}>
                                    {keywords.map(kw => (
                                        <span key={kw} className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-medium pl-3 pr-1.5 py-1 rounded-full">
                                            {kw}
                                            <button onClick={() => setKeywords(p => p.filter(k => k !== kw))} className="w-4 h-4 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center transition-colors">
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:close-circle-linear" class="text-[10px]" />
                                            </button>
                                        </span>
                                    ))}
                                    <input id="kw-input" type="text" value={kwInput}
                                        onChange={e => setKwInput(e.target.value)} onKeyDown={onKwKey} onBlur={addKw}
                                        placeholder={keywords.length === 0 ? 'e.g. CRM tools, sales automation…' : ''}
                                        className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-700 placeholder-gray-300 focus:outline-none" />
                                </div>
                                <p className="text-[11px] text-gray-400">{keywords.length}/20 keywords</p>
                            </div>

                            {/* Frequency */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:clock-circle-linear" class="text-amber-500 text-lg" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-900">Scrape Frequency</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">How often should SignalReach scan for new signals?</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {FREQ_OPTS.map(o => (
                                        <button key={o.value} onClick={() => setFreq(o.value)}
                                            className={`flex flex-col items-center text-center gap-1 p-4 rounded-xl border-2 transition-all ${freq === o.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                            <span className={`text-sm font-semibold ${freq === o.value ? 'text-indigo-700' : 'text-gray-700'}`}>{o.label}</span>
                                            <span className={`text-[11px] ${freq === o.value ? 'text-indigo-400' : 'text-gray-400'}`}>{o.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400">Changes take effect on the next scraper run.</p>
                                <button onClick={saveInt} disabled={savingInt}
                                    className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl shadow-sm transition-all">
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon={savingInt ? 'solar:refresh-linear' : 'solar:diskette-linear'} class={`text-base ${savingInt ? 'animate-spin' : ''}`} />
                                    {savingInt ? 'Saving…' : 'Save Integration Settings'}
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── BILLING ── */}
            {tab === 'Billing' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:card-2-linear" class="text-indigo-500 text-lg" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Current Plan</p>
                                <p className="text-xs text-gray-400 mt-0.5">Your workspace is on the free tier.</p>
                            </div>
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Free Tier
                        </span>
                    </div>
                    <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                        {[
                            { label: 'Signals per month', free: '100', pro: 'Unlimited' },
                            { label: 'AI reply drafts', free: '10 / mo', pro: 'Unlimited' },
                            { label: 'Platforms', free: 'Reddit only', pro: 'Reddit, Twitter, LinkedIn' },
                            { label: 'Scrape frequency', free: 'Daily', pro: 'Every 6 hours' },
                        ].map(r => (
                            <div key={r.label} className="grid grid-cols-3 px-4 py-3 text-sm">
                                <span className="text-gray-600">{r.label}</span>
                                <span className="text-gray-400 text-center">{r.free}</span>
                                <span className="text-indigo-600 font-medium text-center">{r.pro}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => toast('Billing portal coming soon!', { icon: '💳' })}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition-all">
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="solar:crown-star-linear" class="text-base" />
                        Upgrade to Pro — $29/mo
                    </button>
                    <p className="text-center text-xs text-gray-400">No credit card required to try. Cancel anytime.</p>
                </div>
            )}
        </div>
    );
}
