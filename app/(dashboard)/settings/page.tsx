'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'account' | 'billing';

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'account', label: 'Account', icon: 'solar:user-circle-linear' },
    { id: 'billing', label: 'Billing', icon: 'solar:card-linear' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('account');
    const [resetting, setResetting] = useState(false);

    const handleResetPassword = useCallback(async () => {
        setResetting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            toast.error('No email found for your account.');
            setResetting(false);
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(user.email);
        if (error) {
            toast.error('Failed to send reset email.');
        } else {
            toast.success('Password reset email sent! Check your inbox. ✉️');
        }
        setResetting(false);
    }, []);

    return (
        <div className="flex flex-col gap-6 max-w-2xl">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-sm text-gray-400 mt-0.5">Manage your account and subscription.</p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                    >
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon={tab.icon} class="text-base" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Account Tab ─────────────────────────────────────────────────── */}
            {activeTab === 'account' && (
                <div className="flex flex-col gap-5">

                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-5">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:user-circle-linear" class="text-indigo-600 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Profile Information</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Update your account details.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue="Sarah Reynolds"
                                    className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Address</label>
                                <input
                                    type="email"
                                    defaultValue="sarah@acmecorp.io"
                                    className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => toast.success('Profile saved!')}
                                className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-5 py-2 rounded-lg shadow-sm transition-all duration-150"
                            >
                                Save Profile
                            </button>
                        </div>
                    </div>

                    {/* Password card */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:lock-password-linear" class="text-amber-500 text-lg" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Password</p>
                                <p className="text-xs text-gray-400 mt-0.5">We will send a reset link to your email.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleResetPassword}
                            disabled={resetting}
                            className="shrink-0 flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 disabled:opacity-60 px-4 py-2 rounded-lg transition-all duration-150"
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon
                                icon={resetting ? 'solar:refresh-linear' : 'solar:letter-opened-linear'}
                                class={`text-base ${resetting ? 'animate-spin' : ''}`}
                            />
                            {resetting ? 'Sending…' : 'Reset Password'}
                        </button>
                    </div>

                    {/* Danger zone */}
                    <div className="bg-white border border-red-100 rounded-xl shadow-sm p-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:trash-bin-trash-linear" class="text-red-400 text-lg" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Delete Account</p>
                                <p className="text-xs text-gray-400 mt-0.5">This will permanently delete your account and all data.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toast.error('Please contact support to delete your account.')}
                            className="shrink-0 text-sm font-medium text-red-500 border border-red-200 bg-white hover:bg-red-50 active:scale-95 px-4 py-2 rounded-lg transition-all duration-150"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* ── Billing Tab ─────────────────────────────────────────────────── */}
            {activeTab === 'billing' && (
                <div className="flex flex-col gap-5">

                    {/* Current plan */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-5">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:card-linear" class="text-gray-500 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Current Plan</h2>
                                <p className="text-xs text-gray-400 mt-0.5">You are on the free tier.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
                            <div>
                                <p className="text-base font-bold text-gray-900">Free Tier</p>
                                <p className="text-xs text-gray-400 mt-0.5">10 signals / day · 1 workspace · Community support</p>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">Active</span>
                        </div>

                        <button
                            onClick={() => toast('Pro upgrade coming soon! 🚀', { icon: '✨' })}
                            className="flex items-center justify-center gap-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 px-6 py-3 rounded-xl shadow-md shadow-indigo-200 transition-all duration-150"
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:crown-linear" class="text-base" />
                            Upgrade to Pro — $49/mo
                        </button>
                    </div>

                    {/* Pro features list */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-4">
                        <p className="text-sm font-semibold text-gray-700">What you get with Pro</p>
                        <div className="grid grid-cols-1 gap-2.5">
                            {[
                                'Unlimited signals per day',
                                'All platforms (Reddit, Twitter, LinkedIn)',
                                'Up to 5 workspaces',
                                'Priority scraper runs (every 6h)',
                                'Unlimited AI reply drafts',
                                'Priority email support',
                            ].map((feat) => (
                                <div key={feat} className="flex items-center gap-2.5">
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:check-circle-bold" class="text-indigo-500 text-base shrink-0" />
                                    <span className="text-sm text-gray-700">{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
