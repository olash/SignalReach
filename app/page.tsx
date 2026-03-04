'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navigation */}
            <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <nav className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:radar-linear" class="text-xl"></iconify-icon>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900">SignalReach</span>
                    </div>
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                        <a href="#features" className="hover:text-gray-900 transition-colors">How it Works</a>
                        <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
                        <div className="flex items-center gap-4 border-l border-gray-200 pl-8">
                            <Link href="/welcome" className="hover:text-gray-900 transition-colors">Sign In</Link>
                            <Link href="/welcome" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95">
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon={isMobileMenuOpen ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} class="text-2xl"></iconify-icon>
                    </button>
                </nav>
                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 inset-x-0 bg-white border-b border-gray-100 shadow-lg py-4 px-5 flex flex-col gap-4 z-50">
                        <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">How it Works</a>
                        <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Pricing</Link>
                        <div className="h-px bg-gray-100 my-2"></div>
                        <Link href="/welcome" className="text-gray-600 font-medium text-center py-2">Sign In</Link>
                        <Link href="/welcome" className="bg-indigo-600 text-white font-medium text-center py-2.5 rounded-lg shadow-sm">Get Started Free</Link>
                    </div>
                )}
            </header>
            <main>
                {/* Hero Section */}
                <section className="pt-32 pb-20 px-5 lg:px-8 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6 border border-indigo-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Now tracking Reddit & Twitter
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight max-w-4xl mx-auto">
                        Stop searching for clients. <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Start closing them.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        SignalReach listens to social media for high-intent buyers, drafts the perfect personalized pitch, and drops them into a visual pipeline.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/welcome" className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                            Start your free pipeline
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:arrow-right-linear" class="text-lg"></iconify-icon>
                        </Link>
                    </div>
                </section>
                {/* Features Section */}
                <section id="features" className="py-24 bg-gray-50 border-y border-gray-100">
                    <div className="max-w-7xl mx-auto px-5 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-gray-900">Your automated outbound engine</h2>
                            <p className="text-gray-500 mt-3">From scraping to closing in three seamless steps.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: 'solar:radar-linear', title: 'Deep Scraping', desc: 'We bypass API limits to find real-time posts from founders and clients begging for your exact skills.' },
                                { icon: 'solar:magic-stick-3-linear', title: 'AI Copilot Drafting', desc: 'Gemini analyzes the prospect\'s post and writes a highly personalized, platform-optimized DM in seconds.' },
                                { icon: 'solar:kanban-linear', title: 'Visual Pipeline', desc: 'Never lose a lead again. Triage, send, and follow-up seamlessly using our buttery-smooth Kanban board.' }
                            ].map((feature, i) => (
                                <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon icon={feature.icon} class="text-2xl"></iconify-icon>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <footer className="border-t border-gray-100 bg-white py-12 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} SignalReach. All rights reserved.</p>
            </footer>
        </div>
    );
}
