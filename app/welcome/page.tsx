'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'reddit' | 'twitter' | 'linkedin';
type Persona = 'freelancer' | 'saas';

interface FormState {
    platforms: Platform[];
    persona: Persona | null;
    twitterHandle: string;
    redditUsername: string;
    linkedinUrl: string;
    websiteUrl: string;
    keywords: string;
}

const STEP_PROGRESS: Record<number, string> = {
    1: 'w-1/3',
    2: 'w-2/3',
    3: 'w-full',
};

const PLATFORMS: { id: Platform; label: string; icon: string; color: string; bg: string }[] = [
    { id: 'reddit', label: 'Reddit', icon: 'solar:reddit-linear', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
    { id: 'twitter', label: 'Twitter', icon: 'solar:twitter-linear', color: 'text-sky-500', bg: 'bg-sky-50 border-sky-200' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'solar:linkedin-linear', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
];

const inputCls =
    'w-full px-3.5 py-2.5 text-sm text-[#111827] bg-[#F9FAFB] border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-200';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5';

// ─────────────────────────────────────────────────────────────────────────────

export default function WelcomePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isNew = searchParams.get('new') === 'true';

    // Start at step 1 directly — auth already handled by AuthContext
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'url' | 'manual'>('url');
    const [sessionChecked, setSessionChecked] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [form, setForm] = useState<FormState>({
        platforms: [],
        persona: null,
        twitterHandle: '',
        redditUsername: '',
        linkedinUrl: '',
        websiteUrl: '',
        keywords: '',
    });

    // ── On mount: verify auth and check if workspace already exists ──────────

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data }) => {
            if (!data.session) {
                router.replace('/dashboard'); // AuthGate will show login
                return;
            }
            if (isNew) {
                setSessionChecked(true);
                return;
            }
            // If user already has a workspace, skip onboarding
            const { data: ws } = await supabase
                .from('workspaces')
                .select('id')
                .eq('user_id', data.session.user.id)
                .limit(1);

            if (ws && ws.length > 0) {
                router.replace('/dashboard');
                return;
            }
            setSessionChecked(true);
        });
    }, [router, isNew]);

    // ── Redirect on Success ──────────
    useEffect(() => {
        if (isSuccess) {
            router.push('/dashboard');
        }
    }, [isSuccess, router]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const togglePlatform = (p: Platform) =>
        setForm((f) => ({
            ...f,
            platforms: f.platforms.includes(p)
                ? f.platforms.filter((x) => x !== p)
                : [...f.platforms, p],
        }));

    const setPersona = (p: Persona) => {
        setForm((f) => ({ ...f, persona: p }));
        setActiveTab(p === 'saas' ? 'url' : 'manual');
    };

    // Step 1 is valid when ≥1 platform AND a persona are both selected
    const step1Valid = form.platforms.length > 0 && form.persona !== null;

    // Step 2 is valid when every selected platform has its handle filled in
    const step2Valid = form.platforms.every((p) => {
        if (p === 'twitter') return form.twitterHandle.trim().length > 0;
        if (p === 'reddit') return form.redditUsername.trim().length > 0;
        if (p === 'linkedin') return form.linkedinUrl.trim().length > 0;
        return true;
    });

    // ── Complete Onboarding ────────────────────────────────────────────────────

    const completeOnboarding = async () => {
        setLoading(true);
        try {
            const { data: { user }, error: authErr } = await supabase.auth.getUser();
            if (authErr || !user) throw authErr ?? new Error('Not authenticated');

            // 1 ─ Insert workspace
            const { data: workspace, error: wsErr } = await supabase
                .from('workspaces')
                .insert({
                    user_id: user.id,
                    name: 'My Primary Workspace',
                    account_type: form.persona,
                    website_url: form.websiteUrl.trim() || null,
                    keywords: form.keywords.trim() || null,
                })
                .select('id')
                .single();
            if (wsErr) throw wsErr;

            // 2 ─ Insert social profiles (skip empty handles)
            const profiles = [
                { platform: 'twitter', handle: form.twitterHandle },
                { platform: 'reddit', handle: form.redditUsername },
                { platform: 'linkedin', handle: form.linkedinUrl },
            ].filter((p) => p.handle.trim());

            if (profiles.length > 0) {
                const { error: spErr } = await supabase
                    .from('social_profiles')
                    .insert(
                        profiles.map((p) => ({
                            user_id: user.id,
                            workspace_id: workspace.id,
                            platform: p.platform,
                            handle: p.handle.trim(),
                        }))
                    );
                if (spErr) throw spErr;
            }

            toast.success('Workspace created! Scanning for signals...');

            // 3 ─ Fire scraper in the background — do NOT await so the user
            //     is redirected immediately while Apify works in the background.
            fetch('https://signalreach.onrender.com/api/cron/scrape', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer signalreach_cron_99x!' },
            }).catch((err) => console.error('[onboarding] Background scrape trigger failed:', err));

            setIsSuccess(true);
        } catch (err) {
            console.error('[onboarding]', err);
            toast.error('Could not save your setup. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Loading shimmer ────────────────────────────────────────────────────────

    if (!sessionChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
                {/* @ts-expect-error custom element */}
                <iconify-icon icon="solar:spinner-linear" class="text-3xl text-indigo-500 animate-spin" />
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4 py-12">
            <div className="w-full max-w-lg">

                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:radar-linear" class="text-2xl text-indigo-600" />
                    <span className="text-lg font-semibold text-gray-900 tracking-tight">SignalReach</span>
                </div>

                {/* Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 w-full">
                        <div className={`h-full bg-indigo-600 transition-all duration-500 ease-out ${STEP_PROGRESS[step]}`} />
                    </div>

                    <div className="px-8 pt-8 pb-9">

                        {/* Step indicator */}
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">
                            Step {step} of 3
                        </p>

                        {/* ── STEP 1 — Platforms & Persona ──────────────────────────────── */}
                        {step === 1 && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-xl font-semibold text-[#111827] tracking-tight">
                                        Where do your ideal clients hang out?
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Select at least one platform <span className="text-indigo-400 font-medium">and</span> your persona to continue.
                                    </p>
                                </div>

                                {/* Platform cards */}
                                <div className="flex flex-col gap-3">
                                    {PLATFORMS.map((p) => {
                                        const active = form.platforms.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => togglePlatform(p.id)}
                                                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 ${active
                                                    ? `${p.bg} border-current shadow-sm`
                                                    : 'bg-[#F9FAFB] border-gray-200 hover:border-gray-300 hover:bg-white'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all ${active ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                                    {active && (
                                                        // @ts-expect-error custom element
                                                        <iconify-icon icon="solar:check-read-linear" class="text-white text-[11px]" />
                                                    )}
                                                </div>
                                                <div className={`w-9 h-9 rounded-lg ${active ? p.bg : 'bg-gray-100'} flex items-center justify-center transition-colors`}>
                                                    {/* @ts-expect-error custom element */}
                                                    <iconify-icon icon={p.icon} class={`text-xl ${active ? p.color : 'text-gray-400'}`} />
                                                </div>
                                                <span className={`text-sm font-medium ${active ? 'text-[#111827]' : 'text-gray-500'}`}>{p.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Persona toggle */}
                                <div>
                                    <p className={labelCls}>I am a…</p>
                                    <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-1 gap-1">
                                        {(['freelancer', 'saas'] as Persona[]).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setPersona(p)}
                                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${form.persona === p
                                                    ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                                                    : 'text-gray-500 hover:text-[#111827]'
                                                    }`}
                                            >
                                                {p === 'freelancer' ? '🧑‍💻  Freelancer' : '🏢  SaaS / Business'}
                                            </button>
                                        ))}
                                    </div>
                                    {!step1Valid && (
                                        <p className="text-[11px] text-amber-500 mt-2 flex items-center gap-1">
                                            {/* @ts-expect-error custom element */}
                                            <iconify-icon icon="solar:info-circle-linear" class="text-sm" />
                                            {form.platforms.length === 0 && form.persona === null
                                                ? 'Pick at least one platform and select your persona.'
                                                : form.platforms.length === 0
                                                    ? 'Pick at least one platform.'
                                                    : 'Select your persona.'}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!step1Valid}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm"
                                >
                                    Continue
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:arrow-right-linear" class="ml-1.5 text-base align-middle" />
                                </button>
                            </div>
                        )}

                        {/* ── STEP 2 — Social Handles ────────────────────────────────────── */}
                        {step === 2 && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-xl font-semibold text-[#111827] tracking-tight">
                                        Connect your profiles.
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Fill in the handle for each platform you selected.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {/* Twitter — only show if selected */}
                                    {form.platforms.includes('twitter') && (
                                        <div>
                                            <label className={labelCls}>
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:twitter-linear" class="text-sky-400 mr-1.5 align-middle" />
                                                Twitter Handle <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">@</span>
                                                <input
                                                    type="text"
                                                    placeholder="yourhandle"
                                                    value={form.twitterHandle}
                                                    onChange={(e) => setForm((f) => ({ ...f, twitterHandle: e.target.value }))}
                                                    className={`${inputCls} pl-8`}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Reddit — only show if selected */}
                                    {form.platforms.includes('reddit') && (
                                        <div>
                                            <label className={labelCls}>
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:reddit-linear" class="text-orange-400 mr-1.5 align-middle" />
                                                Reddit Username <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">u/</span>
                                                <input
                                                    type="text"
                                                    placeholder="yourusername"
                                                    value={form.redditUsername}
                                                    onChange={(e) => setForm((f) => ({ ...f, redditUsername: e.target.value }))}
                                                    className={`${inputCls} pl-10`}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* LinkedIn — only show if selected */}
                                    {form.platforms.includes('linkedin') && (
                                        <div>
                                            <label className={labelCls}>
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:linkedin-linear" class="text-blue-500 mr-1.5 align-middle" />
                                                LinkedIn Profile URL <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://linkedin.com/in/yourprofile"
                                                value={form.linkedinUrl}
                                                onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                                                className={inputCls}
                                            />
                                        </div>
                                    )}
                                </div>

                                {!step2Valid && (
                                    <p className="text-[11px] text-amber-500 flex items-center gap-1 -mt-2">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:info-circle-linear" class="text-sm" />
                                        Fill in all required handles to continue.
                                    </p>
                                )}

                                <div className="flex gap-3">
                                    <button onClick={() => setStep(1)}
                                        className="px-4 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200">
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={!step2Valid}
                                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm"
                                    >
                                        Continue
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:arrow-right-linear" class="ml-1.5 text-base align-middle" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3 — Keywords ────────────────────────────────────────────── */}
                        {step === 3 && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-xl font-semibold text-[#111827] tracking-tight">
                                        What are your target keywords?
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-1">
                                        SignalReach will scan for conversations matching these topics.
                                    </p>
                                </div>

                                {/* Tabs */}
                                <div>
                                    <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-1 gap-1 mb-5">
                                        <button
                                            onClick={() => setActiveTab('url')}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'url'
                                                ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                                                : 'text-gray-500 hover:text-[#111827]'
                                                }`}
                                        >
                                            {/* @ts-expect-error custom element */}
                                            <iconify-icon icon="solar:globus-linear" class="text-base" />
                                            Auto-Generate via URL
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('manual')}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'manual'
                                                ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                                                : 'text-gray-500 hover:text-[#111827]'
                                                }`}
                                        >
                                            {/* @ts-expect-error custom element */}
                                            <iconify-icon icon="solar:keyboard-linear" class="text-base" />
                                            Enter Manually
                                        </button>
                                    </div>

                                    {activeTab === 'url' && (
                                        <div className="flex flex-col gap-2">
                                            <label className={labelCls}>Your website URL</label>
                                            <div className="relative">
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:link-linear" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                                                <input
                                                    type="url"
                                                    placeholder="https://yourproduct.com"
                                                    value={form.websiteUrl}
                                                    onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                                                    className={`${inputCls} pl-9 py-3 text-base`}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:magic-stick-3-linear" class="text-indigo-400" />
                                                We&apos;ll scan your homepage and auto-suggest the best keywords.
                                            </p>
                                        </div>
                                    )}

                                    {activeTab === 'manual' && (
                                        <div className="flex flex-col gap-2">
                                            <label className={labelCls}>Target keywords</label>
                                            <textarea
                                                rows={3}
                                                placeholder="e.g. freelance developer, web design for startups, hire a designer…"
                                                value={form.keywords}
                                                onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                                                className={`${inputCls} resize-none`}
                                            />
                                            <p className="text-xs text-gray-400">Separate keywords with commas or new lines.</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="mt-4 text-xs text-gray-400 hover:text-indigo-500 transition-colors underline underline-offset-2 block"
                                    >
                                        Skip for now &amp; use a Template
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setStep(2)}
                                        className="px-4 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200">
                                        Back
                                    </button>
                                    <button
                                        onClick={completeOnboarding}
                                        disabled={loading}
                                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:refresh-linear" class="text-base animate-spin" />
                                                Scanning for signals…
                                            </>
                                        ) : (
                                            <>
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon icon="solar:radar-linear" class="text-base" />
                                                Start Listening
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-gray-400 mt-5">
                    You can change these settings anytime in{' '}
                    <span className="text-indigo-500 font-medium">Settings → Integrations</span>.
                </p>
            </div>
        </div>
    );
}
