import Link from 'next/link';

// ─── Feature data ─────────────────────────────────────────────────────────────

const features = [
    {
        icon: 'solar:radar-linear',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        title: 'Intent Signal Detection',
        desc: 'Scan Reddit, Twitter, and LinkedIn in real-time for prospects who are already talking about problems you solve.',
    },
    {
        icon: 'solar:magic-stick-3-linear',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        title: 'AI-Crafted Replies',
        desc: 'Generate authentic, tone-matched outreach in one click. No templates. No spray-and-pray. Just real conversations.',
    },
    {
        icon: 'solar:chart-2-linear',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        title: 'Kanban Pipeline',
        desc: 'Move signals from "new" to "closed" with a simple drag-and-drop board. Your entire outreach pipeline, zero clutter.',
    },
];

const testimonials = [
    {
        quote: 'SignalReach helped us close 3 deals in our first week. We went from cold email to replying to people already asking for what we sell.',
        name: 'Marcus T.',
        role: 'Founder, Stackr.io',
    },
    {
        quote: 'The AI drafts are scarily good. I edit them in 30 seconds and hit send. Our reply rate is up 60%.',
        name: 'Priya K.',
        role: 'Head of Growth, Loanly',
    },
    {
        quote: "I've tried every prospecting tool. Nothing comes close to the intent signal quality SignalReach surfaces daily.",
        name: 'Dave R.',
        role: 'SDR Lead, Acme Corp',
    },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans text-[#111827]">

            {/* ── Nav ──────────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:radar-linear" class="text-white text-base" />
                        </div>
                        <span className="font-semibold text-[#111827] tracking-tight text-base">SignalReach</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-4 py-2 rounded-lg shadow-sm transition-all duration-150"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Hero ─────────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden">
                {/* Gradient blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
                    <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-indigo-100 rounded-full mix-blend-multiply opacity-40 blur-3xl" />
                    <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-purple-100 rounded-full mix-blend-multiply opacity-40 blur-3xl" />
                </div>

                <div className="relative max-w-6xl mx-auto px-5 pt-24 pb-28 text-center flex flex-col items-center gap-8">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold px-3.5 py-1.5 rounded-full">
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="solar:radar-linear" class="text-sm" />
                        Intent-Based Prospecting — Now Powered by AI
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#111827] leading-[1.1] max-w-3xl">
                        Turn Social{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
                            Signals
                        </span>{' '}
                        into Customers
                    </h1>

                    <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
                        SignalReach monitors Reddit, Twitter, and LinkedIn for prospects
                        actively asking for what you sell — then drafts the perfect reply in seconds.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-8 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all duration-150"
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:radar-linear" class="text-base" />
                            Start Listening for Free
                        </Link>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 px-6 py-3 rounded-xl transition-all duration-150 shadow-sm"
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:play-circle-linear" class="text-base" />
                            See How It Works
                        </Link>
                    </div>

                    {/* Social proof row */}
                    <p className="text-xs text-gray-400 mt-2">
                        Trusted by <span className="font-semibold text-gray-600">240+</span> founders &amp; sales teams · No credit card required
                    </p>
                </div>
            </section>

            {/* ── Features ─────────────────────────────────────────────────────── */}
            <section className="bg-white border-t border-b border-gray-200 py-20">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">Everything you need to close more deals</h2>
                        <p className="text-gray-500 mt-3 text-base max-w-lg mx-auto">
                            From signal detection to sent reply — the entire workflow in one clean tool.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="bg-[#F9FAFB] rounded-2xl border border-gray-200 p-7 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center`}>
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon={f.icon} class={`${f.color} text-2xl`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#111827] text-base">{f.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ─────────────────────────────────────────────────── */}
            <section className="py-20 max-w-6xl mx-auto px-5">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">Loved by sales teams</h2>
                    <p className="text-gray-500 mt-3 text-base">Real results from real people.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div
                            key={t.name}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4"
                        >
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    // @ts-expect-error custom element
                                    <iconify-icon key={i} icon="solar:star-bold" class="text-amber-400 text-sm" />
                                ))}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed flex-1">
                                &ldquo;{t.quote}&rdquo;
                            </p>
                            <div>
                                <p className="text-sm font-semibold text-[#111827]">{t.name}</p>
                                <p className="text-xs text-gray-400">{t.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA Banner ───────────────────────────────────────────────────── */}
            <section className="bg-indigo-600 py-20">
                <div className="max-w-3xl mx-auto px-5 text-center flex flex-col items-center gap-6">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                        Ready to find your next customer?
                    </h2>
                    <p className="text-indigo-200 text-base max-w-md">
                        Join hundreds of founders who stopped guessing and started listening.
                    </p>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-700 bg-white hover:bg-indigo-50 active:scale-95 px-8 py-3 rounded-xl shadow-lg transition-all duration-150"
                    >
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="solar:radar-linear" class="text-base" />
                        Start Listening for Free
                    </Link>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────────────── */}
            <footer className="bg-white border-t border-gray-200 py-8">
                <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:radar-linear" class="text-white text-xs" />
                        </div>
                        <span className="text-sm font-semibold text-[#111827]">SignalReach</span>
                    </div>
                    <p className="text-xs text-gray-400">&copy; 2026 SignalReach. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
                        <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
