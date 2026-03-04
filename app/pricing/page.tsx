'use client';
import Link from 'next/link';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 pt-10">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#F9FAFB]/80 border-b border-gray-200/80">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="font-semibold tracking-tighter text-xl text-[#111827]">SIGNALREACH</Link>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
                        <Link href="/" className="hover:text-[#111827] transition-colors">Product</Link>
                        <Link href="/" className="hover:text-[#111827] transition-colors">Customers</Link>
                        <Link href="/pricing" className="hover:text-[#111827] transition-colors">Pricing</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/welcome" className="text-sm text-gray-500 hover:text-[#111827] transition-colors hidden md:block">Log in</Link>
                        <Link href="/welcome" className="text-sm font-medium bg-[#4F46E5] text-white px-4 py-2 rounded-lg hover:bg-[#4338CA] hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all">Get Started</Link>
                    </div>
                </div>
            </nav>

            <main className="py-20 max-w-7xl mx-auto px-5 lg:px-8 mt-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h1>
                    <p className="text-lg text-gray-500">Scale your outbound without scaling your headcount.</p>
                </div>
                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                    {/* Free Tier */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 hover:border-gray-300 transition-colors">
                        <h3 className="text-xl font-bold text-gray-900">Hustler</h3>
                        <p className="text-gray-500 mt-2 text-sm">Perfect to test the waters.</p>
                        <div className="my-6">
                            <span className="text-4xl font-extrabold text-gray-900">$0</span>
                            <span className="text-gray-500 font-medium">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-gray-400 text-lg"></iconify-icon>
                                15 AI Drafts / month
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-gray-400 text-lg"></iconify-icon>
                                1 Workspace
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-gray-400 text-lg"></iconify-icon>
                                Manual Scraping (24h cooldown)
                            </li>
                        </ul>
                        <Link href="/welcome" className="block w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-900 text-center font-semibold rounded-xl border border-gray-200 transition-colors">
                            Sign Up Free
                        </Link>
                    </div>
                    {/* Pro Tier */}
                    <div className="bg-white p-8 rounded-3xl border-2 border-indigo-600 shadow-xl relative transform lg:-translate-y-4 z-10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Most Popular
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Freelancer</h3>
                        <p className="text-gray-500 mt-2 text-sm">A steady stream of contract work.</p>
                        <div className="my-6">
                            <span className="text-4xl font-extrabold text-gray-900">$29</span>
                            <span className="text-gray-500 font-medium">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-indigo-600 text-lg"></iconify-icon>
                                <span className="font-semibold text-gray-900">250 AI Drafts / month</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-indigo-600 text-lg"></iconify-icon>
                                3 Workspaces
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-indigo-600 text-lg"></iconify-icon>
                                Daily Automated Scraping
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-indigo-600 text-lg"></iconify-icon>
                                Multi-tone AI Engine
                            </li>
                        </ul>
                        <Link href="/welcome" className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold rounded-xl shadow-sm transition-colors active:scale-95">
                            Start Pro Trial
                        </Link>
                    </div>
                    {/* Agency Tier */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 hover:border-gray-300 transition-colors">
                        <h3 className="text-xl font-bold text-gray-900">Agency</h3>
                        <p className="text-gray-500 mt-2 text-sm">For SDRs running multiple clients.</p>
                        <div className="my-6">
                            <span className="text-4xl font-extrabold text-gray-900">$79</span>
                            <span className="text-gray-500 font-medium">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-gray-400 text-lg"></iconify-icon>
                                <span className="font-semibold text-gray-900">1,000 AI Drafts / month</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-gray-400 text-lg"></iconify-icon>
                                Unlimited Workspaces
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:check-circle-bold" class="text-gray-400 text-lg"></iconify-icon>
                                Hourly Automated Scraping
                            </li>
                        </ul>
                        <Link href="/welcome" className="block w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-900 text-center font-semibold rounded-xl border border-gray-200 transition-colors">
                            Go Agency
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
