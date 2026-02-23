'use client';

import { useEffect, useState, useCallback, KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Frequency = '6h' | '24h' | '7d';

const FREQUENCY_OPTIONS: { value: Frequency; label: string; desc: string }[] = [
    { value: '6h', label: 'Every 6 hours', desc: 'Best for active campaigns' },
    { value: '24h', label: 'Daily', desc: 'Balanced & recommended' },
    { value: '7d', label: 'Weekly', desc: 'Light-touch monitoring' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinesPage() {
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [frequency, setFrequency] = useState<Frequency>('24h');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ── Fetch workspace settings ───────────────────────────────────────────────
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id, keywords, scrape_frequency')
            .eq('user_id', user.id)
            .limit(1);

        if (workspaces?.length) {
            const ws = workspaces[0];
            setWorkspaceId(ws.id);
            if (ws.keywords) {
                // keywords may be a comma-delimited string or already an array
                const raw: string = ws.keywords;
                setKeywords(raw.split(',').map((k: string) => k.trim()).filter(Boolean));
            }
            if (ws.scrape_frequency) setFrequency(ws.scrape_frequency as Frequency);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    // ── Tag input helpers ─────────────────────────────────────────────────────
    const addKeyword = () => {
        const val = inputValue.trim();
        if (!val) return;
        if (keywords.includes(val)) { setInputValue(''); return; }
        if (keywords.length >= 20) { toast.error('Maximum 20 keywords.'); return; }
        setKeywords((prev) => [...prev, val]);
        setInputValue('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addKeyword();
        } else if (e.key === 'Backspace' && !inputValue) {
            setKeywords((prev) => prev.slice(0, -1));
        }
    };

    const removeKeyword = (kw: string) => {
        setKeywords((prev) => prev.filter((k) => k !== kw));
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!workspaceId) {
            toast.error('No workspace found. Complete onboarding first.');
            return;
        }
        setSaving(true);
        const { error } = await supabase
            .from('workspaces')
            .update({
                keywords: keywords.join(', '),
                scrape_frequency: frequency,
            })
            .eq('id', workspaceId);

        if (error) {
            toast.error('Failed to save settings.');
            console.error('[Pipelines] save error:', error.message);
        } else {
            toast.success('Pipeline settings saved! ✅');
        }
        setSaving(false);
    };

    const selectedFreq = FREQUENCY_OPTIONS.find((f) => f.value === frequency)!;

    return (
        <div className="flex flex-col gap-8 max-w-2xl">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Pipeline Settings</h1>
                <p className="text-sm text-gray-400 mt-0.5">Configure what your scraper looks for and how often it runs.</p>
            </div>

            {loading ? (
                <div className="flex flex-col gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse space-y-4">
                            <div className="w-40 h-4 bg-gray-200 rounded" />
                            <div className="w-full h-24 bg-gray-100 rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* ── Scrape Targets Card ──────────────────────────────────────── */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-5">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:magnifer-zoom-in-linear" class="text-indigo-500 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Target Keywords</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Scraper will search Reddit, Twitter, and LinkedIn for these terms. Press <kbd className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">Enter</kbd> or <kbd className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">,</kbd> to add.</p>
                            </div>
                        </div>

                        {/* Tag chip input */}
                        <div
                            className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[52px] focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-300 transition cursor-text"
                            onClick={() => document.getElementById('kw-input')?.focus()}
                        >
                            {keywords.map((kw) => (
                                <span
                                    key={kw}
                                    className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-medium pl-3 pr-2 py-1 rounded-full"
                                >
                                    {kw}
                                    <button
                                        onClick={() => removeKeyword(kw)}
                                        className="w-4 h-4 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center transition-colors"
                                        aria-label={`Remove ${kw}`}
                                    >
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:close-circle-linear" class="text-[10px]" />
                                    </button>
                                </span>
                            ))}
                            <input
                                id="kw-input"
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={addKeyword}
                                placeholder={keywords.length === 0 ? 'e.g. CRM tools, sales automation…' : ''}
                                className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-700 placeholder-gray-300 focus:outline-none"
                            />
                        </div>

                        <p className="text-[11px] text-gray-400">{keywords.length}/20 keywords added</p>
                    </div>

                    {/* ── Scrape Frequency Card ────────────────────────────────────── */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-5">
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
                            {FREQUENCY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFrequency(opt.value)}
                                    className={`flex flex-col items-center text-center gap-1 p-4 rounded-xl border-2 transition-all duration-150 ${frequency === opt.value
                                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className={`text-sm font-semibold ${frequency === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                                        {opt.label}
                                    </span>
                                    <span className={`text-[11px] ${frequency === opt.value ? 'text-indigo-400' : 'text-gray-400'}`}>
                                        {opt.desc}
                                    </span>
                                    {frequency === opt.value && (
                                        <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center mt-1">
                                            {/* @ts-expect-error custom element */}
                                            <iconify-icon icon="solar:check-read-linear" class="text-white text-[10px]" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Status Card ───────────────────────────────────────────────── */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:shield-check-linear" class="text-emerald-500 text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">Pipeline Status</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Currently scanning for{' '}
                                <span className="font-medium text-gray-600">{keywords.length} keyword{keywords.length !== 1 ? 's' : ''}</span>
                                {' '}·{' '}
                                <span className="font-medium text-gray-600">{selectedFreq.label.toLowerCase()}</span>
                            </p>
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                        </span>
                    </div>

                    {/* ── Save Button ───────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">Changes will take effect on the next scraper run.</p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl shadow-sm transition-all duration-150"
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon
                                icon={saving ? 'solar:refresh-linear' : 'solar:diskette-linear'}
                                class={`text-base ${saving ? 'animate-spin' : ''}`}
                            />
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
