'use client';

import { useAuth } from '@/components/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
    const { user } = useAuth();
    const [tier, setTier] = useState('free');
    const [frequency, setFrequency] = useState('manual');
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchSettings = async () => {
            // Fetch User Tier
            const { data: userData } = await supabase
                .from('users')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();
            if (userData?.subscription_tier) {
                setTier(userData.subscription_tier);
            }
            // Fetch Workspace Scrape Frequency (Assumes user has 1 workspace for now or we fetch the first)
            const { data: wsData } = await supabase
                .from('workspaces')
                .select('id, scrape_frequency')
                .eq('user_id', user.id)
                .limit(1)
                .single();

            if (wsData) {
                setFrequency(wsData.scrape_frequency || 'manual');
            }
            setLoading(false);
        };
        fetchSettings();
    }, [user]);

    // Construct the checkout URL, prefilling the email and optionally passing user_id to custom_data
    const getCheckoutUrl = (variantId: string) => {
        const checkoutUrl = new URL(`https://signalreach.lemonsqueezy.com/checkout/buy/${variantId}`);
        if (user?.email) {
            checkoutUrl.searchParams.set('checkout[email]', user.email);
        }
        if (user?.id) {
            checkoutUrl.searchParams.set('checkout[custom][user_id]', user.id);
        }
        return checkoutUrl.toString();
    };

    const handleFrequencyChange = async (newFreq: string) => {
        if (tier === 'free') return;

        if (tier === 'freelancer' && newFreq === '6h') {
            setToastMessage("Upgrade to the Agency tier to sync every 6 hours!");
            setTimeout(() => setToastMessage(null), 3000);
            return;
        }

        setFrequency(newFreq);

        // Update the First Workspace
        const { data: wsData } = await supabase
            .from('workspaces')
            .select('id')
            .eq('user_id', user?.id)
            .limit(1)
            .single();

        if (wsData) {
            await supabase.from('workspaces').update({ scrape_frequency: newFreq }).eq('id', wsData.id);
            setToastMessage("Scraping frequency updated successfully.");
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto animate-pulse flex flex-col gap-8">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-64 bg-gray-100 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings & Billing</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Subscription</h2>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold uppercase tracking-wider">
                        {tier} Plan
                    </span>
                    {tier === 'free' && <span className="text-gray-500 text-sm">Upgrade to unlock daily automated scraping & more drafts.</span>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Free Plan */}
                    <div className={`p-6 rounded-xl border ${tier === 'free' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 bg-gray-50'} relative`}>
                        <h3 className="font-bold text-gray-900 text-lg">Hustler (Free)</h3>
                        <p className="text-gray-500 text-sm mt-1 mb-6">15 AI Drafts/mo, 1 Workspace, Manual Scraping</p>
                        {tier === 'free' ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold"></iconify-icon>
                                Current Plan
                            </span>
                        ) : (
                            <button disabled className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
                                Downgrade unavailable
                            </button>
                        )}
                    </div>

                    {/* Freelancer Plan */}
                    <div className={`p-6 rounded-xl border ${tier === 'freelancer' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 bg-white shadow-sm'} relative`}>
                        <h3 className="font-bold text-gray-900 text-lg">Freelancer ($29/mo)</h3>
                        <p className="text-gray-500 text-sm mt-1 mb-6">250 AI Drafts/mo, 3 Workspaces, Daily Automated Scraping</p>
                        {tier === 'freelancer' ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold"></iconify-icon>
                                Current Plan
                            </span>
                        ) : (
                            <a
                                href={getCheckoutUrl('FREELANCER_VARIANT_ID')}
                                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                Upgrade to Freelancer
                            </a>
                        )}
                    </div>

                    {/* Agency Plan */}
                    <div className={`p-6 rounded-xl border ${tier === 'agency' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 bg-white shadow-sm'} relative`}>
                        <h3 className="font-bold text-gray-900 text-lg">Agency ($79/mo)</h3>
                        <p className="text-gray-500 text-sm mt-1 mb-6">1,000 AI Drafts/mo, Unlimited Workspaces, Hourly Automated Scraping</p>
                        {tier === 'agency' ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold"></iconify-icon>
                                Current Plan
                            </span>
                        ) : (
                            <a
                                href={getCheckoutUrl('AGENCY_VARIANT_ID')}
                                className="inline-block px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                Upgrade to Agency
                            </a>
                        )}
                    </div>
                </div>

                {/* Scrape Frequency Section */}
                <div className="mt-12 border-t border-gray-100 pt-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Automated Scrape Frequency</h2>
                    <p className="text-sm text-gray-500 mb-6">How often should SignalReach hunt for new leads for your workspace?</p>

                    {tier === 'free' ? (
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <p className="text-gray-600 font-medium flex items-center gap-2">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:info-circle-linear" class="text-gray-400 text-xl"></iconify-icon>
                                Free plan requires manual sync via the Kanban board.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4">
                            {['7d', '24h', '6h'].map((freq) => (
                                <button
                                    key={freq}
                                    onClick={() => handleFrequencyChange(freq)}
                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${frequency === freq
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                >
                                    {freq === '7d' ? 'Weekly (7 Days)' : freq === '24h' ? 'Daily (24 Hours)' : 'Every 6 Hours'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Need to manage your billing, update payment methods, or download invoices?
                        <a href="https://signalreach.lemonsqueezy.com/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline ml-1">
                            Go to Billing Portal
                        </a>
                    </p>
                </div>
            </div>

            {toastMessage && (
                <div className="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up z-50">
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:bell-bing-bold" class="text-indigo-400 text-xl"></iconify-icon>
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
