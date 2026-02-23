'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'Account' | 'Integrations'>('Account');

    // ── Account state ─────────────────────────────────────────────────────────
    const [email, setEmail] = useState('');
    const [originalName, setOriginalName] = useState('');
    const [currentName, setCurrentName] = useState('');

    // ── Integrations state ────────────────────────────────────────────────────
    const [workspaceId, setWorkspaceId] = useState('');
    const [keywords, setKeywords] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [isSaving, setIsSaving] = useState(false);

    // ── Load data on mount ────────────────────────────────────────────────────
    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setEmail(user.email ?? '');
            const name = (user.user_metadata?.full_name as string) ?? '';
            setOriginalName(name);
            setCurrentName(name);

            const { data: ws } = await supabase
                .from('workspaces')
                .select('id, keywords, scrape_frequency')
                .eq('user_id', user.id)
                .maybeSingle();

            if (ws) {
                setWorkspaceId(ws.id);
                setKeywords(ws.keywords ?? '');
                setFrequency(ws.scrape_frequency ?? 'daily');
            }
        };
        fetchSettings();
    }, []);

    // ── Save name ─────────────────────────────────────────────────────────────
    const saveName = async () => {
        setIsSaving(true);
        const { error } = await supabase.auth.updateUser({ data: { full_name: currentName } });
        if (error) toast.error('Failed to update name.');
        else { toast.success('Profile updated!'); setOriginalName(currentName); }
        setIsSaving(false);
    };

    // ── Save integrations ─────────────────────────────────────────────────────
    const saveIntegrations = async () => {
        if (!workspaceId) { toast.error('No workspace found.'); return; }
        setIsSaving(true);
        const { error } = await supabase
            .from('workspaces')
            .update({ keywords, scrape_frequency: frequency })
            .eq('id', workspaceId);
        if (error) toast.error('Failed to save pipeline.');
        else toast.success('Pipeline updated! ✅');
        setIsSaving(false);
    };

    const inputCls = 'w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition';

    return (
        <div className="flex flex-col gap-6 max-w-2xl">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-sm text-gray-400 mt-0.5">Manage your account and scraping pipeline.</p>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-gray-200 gap-6">
                {(['Account', 'Integrations'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── Account Tab ──────────────────────────────────────────────────── */}
            {activeTab === 'Account' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-5 max-w-lg">

                    {/* Email — locked */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Email Address <span className="normal-case text-gray-400 font-normal">(cannot be changed)</span>
                        </label>
                        <input
                            type="email"
                            disabled
                            value={email}
                            className="w-full text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 cursor-not-allowed"
                        />
                    </div>

                    {/* Full name — editable */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                        <input
                            type="text"
                            value={currentName}
                            onChange={(e) => setCurrentName(e.target.value)}
                            placeholder="Your name"
                            className={inputCls}
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={saveName}
                            disabled={currentName === originalName || isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                        >
                            {isSaving ? 'Saving…' : 'Save Name'}
                        </button>
                        {currentName !== originalName && (
                            <button
                                onClick={() => setCurrentName(originalName)}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    {/* Password reset */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Password</p>
                            <p className="text-xs text-gray-400 mt-0.5">A reset link will be sent to your email.</p>
                        </div>
                        <button
                            onClick={async () => {
                                if (!email) return;
                                const { error } = await supabase.auth.resetPasswordForEmail(email);
                                if (error) toast.error('Failed to send reset email.');
                                else toast.success('Reset email sent! ✉️');
                            }}
                            className="shrink-0 text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors"
                        >
                            Reset Password
                        </button>
                    </div>
                </div>
            )}

            {/* ── Integrations Tab ─────────────────────────────────────────────── */}
            {activeTab === 'Integrations' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-5 max-w-lg">

                    {/* Keywords */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Keywords</label>
                        <p className="text-xs text-gray-400">Comma-separated keywords the scraper will search for.</p>
                        <textarea
                            rows={3}
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="ecommerce, shopify, sales automation…"
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Frequency */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scrape Frequency</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className={inputCls}
                        >
                            <option value="6h">Every 6 Hours</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>

                    <button
                        onClick={saveIntegrations}
                        disabled={isSaving}
                        className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                    >
                        {isSaving ? 'Saving…' : 'Save Pipeline Settings'}
                    </button>
                </div>
            )}
        </div>
    );
}
