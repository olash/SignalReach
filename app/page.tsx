'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Page — mirrors index.html exactly ────────────────────────────────────────

export default function LandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    return (
        <div className="bg-[#F9FAFB] text-[#111827] antialiased flex flex-col min-h-screen">

            {/* ── Navigation — exact match to index.html lines 19–34 ─────────── */}
            <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#F9FAFB]/80 border-b border-gray-200/80">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold tracking-tighter text-xl text-[#111827]">SIGNALREACH</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
                        <a href="#" className="hover:text-[#111827] transition-colors">Product</a>
                        <a href="#" className="hover:text-[#111827] transition-colors">Customers</a>
                        <a href="#" className="hover:text-[#111827] transition-colors">Pricing</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-[#111827] transition-colors hidden md:block">
                            Log in
                        </Link>
                        <Link
                            href="/dashboard"
                            className="hidden md:flex text-sm font-medium bg-[#4F46E5] text-white px-4 py-2 rounded-lg hover:bg-[#4338CA] hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all"
                        >
                            Get Started
                        </Link>
                        <button
                            className="md:hidden flex items-center justify-center p-2 text-gray-500 hover:text-gray-900"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon={isMobileMenuOpen ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} class="text-2xl" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 px-6 py-6 flex flex-col gap-4 shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
                        <a href="#" className="text-base font-medium text-gray-600 hover:text-[#111827]">Product</a>
                        <a href="#" className="text-base font-medium text-gray-600 hover:text-[#111827]">Customers</a>
                        <a href="#" className="text-base font-medium text-gray-600 hover:text-[#111827]">Pricing</a>
                        <hr className="border-gray-100 my-2" />
                        <Link href="/dashboard" className="text-base font-medium text-gray-600 hover:text-[#111827]">
                            Log in
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-center text-sm font-medium bg-[#4F46E5] text-white px-4 py-3 rounded-lg hover:bg-[#4338CA] shadow-sm transition-colors mt-2"
                        >
                            Get Started
                        </Link>
                    </div>
                )}
            </nav>

            <main className="flex-grow">

                {/* ── Hero Section — exact match to index.html lines 38–149 ───── */}
                <section className="relative pt-24 pb-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-medium mb-8">
                                <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
                                SignalReach v2.0 is live
                            </div>
                            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-[#111827] leading-[1.1]">
                                Stop spamming. <br className="hidden md:block" />Start listening.
                            </h1>
                            <p className="mt-6 text-lg text-gray-500 leading-relaxed">
                                Shift from bulk cold outreach to signal-based intent capture. Find and engage your next customers the exact moment they ask a relevant question on Reddit or Twitter.
                            </p>
                            <div className="mt-10 flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex justify-center items-center gap-2 text-sm font-medium bg-[#4F46E5] text-white px-6 py-3 rounded-lg hover:bg-[#4338CA] hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all"
                                >
                                    Start Listening
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:arrow-right-linear" class="text-lg" />
                                </Link>
                                <button
                                    className="inline-flex justify-center items-center gap-2 text-sm font-medium text-[#111827] bg-white border border-gray-200 px-6 py-3 rounded-lg hover:bg-gray-50 hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all"
                                >
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:play-circle-linear" class="text-lg text-gray-400" />
                                    See how it works
                                </button>
                            </div>
                        </div>

                        {/* Abstract UI Mockup */}
                        <div className="relative w-full max-w-lg mx-auto lg:ml-auto">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-100 to-transparent rounded-[2rem] blur-2xl opacity-50" />
                            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2 text-sm font-medium text-[#111827]">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:radar-linear" class="text-indigo-600 text-lg" />
                                        Live Intent Stream
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded text-xs font-medium text-green-700">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                                        </span>
                                        Listening
                                    </div>
                                </div>

                                {/* Mock Item 1 */}
                                <div className="flex gap-4 p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors cursor-pointer border border-transparent hover:border-gray-100 group">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:reddit-linear" class="text-xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium text-[#111827] truncate">&ldquo;Looking for alternatives to generic CRMs…&rdquo;</p>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                                                98% Score
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                            <span>r/SaaS</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>2 mins ago</span>
                                        </div>
                                        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-xs font-medium bg-white border border-gray-200 text-[#111827] px-3 py-1.5 rounded-md hover:border-gray-300 shadow-sm">Draft Reply</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Mock Item 2 */}
                                <div className="flex gap-4 p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors cursor-pointer border border-transparent hover:border-gray-100 group">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:twitter-linear" class="text-xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium text-[#111827] truncate">&ldquo;Anyone know a tool that tracks brand mentions?&rdquo;</p>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                                                85% Score
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                            <span>@founder_jack</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>14 mins ago</span>
                                        </div>
                                        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-xs font-medium bg-white border border-gray-200 text-[#111827] px-3 py-1.5 rounded-md hover:border-gray-300 shadow-sm">Draft Reply</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Mock Item 3 (Faded) */}
                                <div className="flex gap-4 p-3 rounded-xl opacity-50">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:reddit-linear" class="text-xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium text-[#111827] truncate">&ldquo;Best resources for B2B sales outreach?&rdquo;</p>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-medium bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                                                42% Score
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                            <span>r/sales</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>1 hour ago</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Social Proof — exact match to index.html lines 152–163 ──── */}
                <section className="border-y border-gray-200/60 bg-[#F9FAFB] py-10">
                    <div className="max-w-7xl mx-auto px-6">
                        <p className="text-center text-xs font-medium uppercase tracking-wider text-gray-500 mb-6">
                            Trusted by forward-thinking revenue teams
                        </p>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60 grayscale">
                            <span className="text-xl font-semibold tracking-tighter text-[#111827]">ACME CORP</span>
                            <span className="text-xl font-semibold tracking-tight text-[#111827] flex items-center gap-1">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:globus-linear" /> GLOBEX
                            </span>
                            <span className="text-xl font-semibold tracking-widest text-[#111827]">SOYUZ</span>
                            <span className="text-xl font-medium tracking-tight text-[#111827]">Initech</span>
                            <span className="text-xl font-semibold tracking-tighter text-[#111827]">UMBRELLA</span>
                        </div>
                    </div>
                </section>

                {/* ── Old Way vs New Way — exact match to index.html lines 166–229 */}
                <section className="py-24 md:py-32">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#111827]">
                                Growth is behavioral,<br />not a numbers game.
                            </h2>
                            <p className="mt-4 text-gray-500 text-lg">
                                Stop shouting into the void. Start inserting yourself naturally into conversations where buying intent is already present.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {/* Old Way */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gray-200" />
                                <h3 className="text-lg font-semibold text-[#111827] mb-6 flex items-center gap-2">
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:close-circle-linear" class="text-gray-400" />
                                    The Old Way
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        'Buying lead lists and bulk spamming cold emails.',
                                        'Celebrating a 0.1% reply rate as a "win".',
                                        'Burning through sending domains weekly.',
                                        'Annoying potential customers before they even know you.',
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-3 text-sm text-gray-500">
                                            {/* @ts-expect-error custom element */}
                                            <iconify-icon icon="solar:minus-circle-linear" class="mt-0.5 text-gray-300 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* New Way */}
                            <div className="bg-white rounded-2xl p-8 border border-indigo-200 shadow-sm relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#4F46E5]" />
                                <h3 className="text-lg font-semibold text-[#111827] mb-6 flex items-center gap-2">
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:check-circle-linear" class="text-[#4F46E5]" />
                                    The SignalReach Way
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        'Capturing behavioral intent on Reddit & Twitter.',
                                        'Engaging exactly when a problem is voiced.',
                                        'High signal conversations with 40%+ conversion rates.',
                                        'Building authentic pipeline through helpfulness.',
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-3 text-sm text-[#111827]">
                                            {/* @ts-expect-error custom element */}
                                            <iconify-icon icon="solar:check-read-linear" class="mt-0.5 text-[#4F46E5] shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Feature Bento Grid — exact match to index.html lines 232–312 */}
                <section className="pb-32">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Feature 1: Multi-platform (col-span-2) */}
                            <div className="col-span-1 md:col-span-2 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden relative">
                                <div className="relative z-10 max-w-md">
                                    <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] border border-gray-100 flex items-center justify-center text-gray-600 mb-6">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:satellite-linear" class="text-xl" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#111827] tracking-tight mb-2">Multi-platform listening</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Monitor specific keywords, competitor mentions, and problem-statements across major social networks simultaneously. We filter the noise so you only see high-intent signals.
                                    </p>
                                </div>
                                <div className="absolute right-0 bottom-0 p-8 hidden sm:flex gap-2 opacity-50">
                                    <div className="w-24 h-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:reddit-linear" class="text-gray-400 text-2xl" />
                                    </div>
                                    <div className="w-24 h-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center -translate-y-4">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:twitter-linear" class="text-gray-400 text-2xl" />
                                    </div>
                                    <div className="w-24 h-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:linkedin-linear" class="text-gray-400 text-2xl" />
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2: AI Drafting (col-span-1) */}
                            <div className="col-span-1 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:magic-stick-3-linear" class="text-xl" />
                                </div>
                                <h3 className="text-xl font-semibold text-[#111827] tracking-tight mb-2">Contextual AI Drafting</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                    Generate hyper-personalized, context-aware replies instantly. Never sound like a bot; always sound like a helpful expert.
                                </p>
                                <div className="w-full h-24 rounded-lg bg-gray-50 border border-gray-100 p-3 flex flex-col gap-2">
                                    <div className="w-3/4 h-2 bg-gray-200 rounded-full" />
                                    <div className="w-full h-2 bg-gray-200 rounded-full" />
                                    <div className="w-1/2 h-2 bg-gray-200 rounded-full" />
                                    <div className="mt-auto self-end text-[10px] font-medium text-indigo-600 flex items-center gap-1">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:pen-new-square-linear" /> AI Generated
                                    </div>
                                </div>
                            </div>

                            {/* Feature 3: Unified Inbox (col-span-3) */}
                            <div className="col-span-1 md:col-span-3 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col md:flex-row items-center gap-8">
                                <div className="md:w-1/3">
                                    <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] border border-gray-100 flex items-center justify-center text-gray-600 mb-6">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon="solar:inbox-linear" class="text-xl" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#111827] tracking-tight mb-2">The Unified Inbox</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Don&apos;t jump between tabs. Manage every intent signal, draft replies, and track engagement from a single, tactile, keyboard-first interface.
                                    </p>
                                </div>
                                <div className="md:w-2/3 w-full bg-[#F9FAFB] border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                                    <div className="flex items-center justify-between px-3 py-2 bg-white rounded border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            <span className="text-xs font-medium text-[#111827]">New lead requesting demo</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">Just now</span>
                                    </div>
                                    <div className="flex items-center justify-between px-3 py-2 bg-white rounded border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                                            <span className="text-xs text-gray-500">Mentioned competitor pricing</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">2h ago</span>
                                    </div>
                                    <div className="flex items-center justify-between px-3 py-2 bg-white rounded border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                                            <span className="text-xs text-gray-500">Asking about API integration</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">5h ago</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer — exact match to index.html lines 316–361 ─────────────── */}
            <footer className="border-t border-gray-200 bg-white pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
                        <div className="col-span-1">
                            <span className="font-semibold tracking-tighter text-lg text-[#111827]">SIGNALREACH</span>
                            <p className="mt-4 text-xs text-gray-500 max-w-xs">
                                High signal, low noise. The modern way to acquire users through behavioral intent.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-[#111827] mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-[#111827] transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-[#111827] transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-[#111827] transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-[#111827] transition-colors">Changelog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-[#111827] mb-4">Resources</h4>
                            <ul className="space-y-3 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-[#111827] transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-[#111827] transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-[#111827] transition-colors">Community</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-[#111827] mb-4">Stay updated</h4>
                            <p className="text-xs text-gray-500 mb-3">Get product updates and outreach tips.</p>
                            <form className="flex items-center" onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="w-full bg-[#F9FAFB] text-sm text-[#111827] px-3 py-2 rounded-l-md border-transparent focus:bg-gray-100 focus:outline-none focus:ring-0 transition-colors placeholder:text-gray-400"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-[#111827] text-white px-3 py-2 rounded-r-md text-sm font-medium hover:bg-gray-800 transition-colors border border-[#111827]"
                                >
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:arrow-right-linear" />
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-400">&copy; 2025 SignalReach Inc. All rights reserved.</p>
                        <div className="flex items-center gap-4 text-gray-400">
                            <a href="#" className="hover:text-[#111827] transition-colors">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:twitter-linear" class="text-lg" />
                            </a>
                            <a href="#" className="hover:text-[#111827] transition-colors">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:github-linear" class="text-lg" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
