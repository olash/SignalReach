export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div>
                <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Your live intent stream and pipeline overview.
                </p>
            </div>

            {/* Placeholder Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Signals Today", value: "142", icon: "solar:radar-linear", color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Replies Drafted", value: "31", icon: "solar:pen-new-square-linear", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Open Pipeline", value: "$84k", icon: "solar:chart-2-linear", color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Conversion Rate", value: "41%", icon: "solar:check-circle-linear", color: "text-amber-600", bg: "bg-amber-50" },
                ].map((card) => (
                    <div
                        key={card.label}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                        <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon={card.icon} class={`${card.color} text-xl`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{card.label}</p>
                            <p className="text-xl font-semibold text-[#111827] tracking-tight">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Placeholder Content Area */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:radar-linear" class="text-indigo-600 text-2xl" />
                </div>
                <h2 className="text-sm font-semibold text-[#111827]">Your intent stream is ready</h2>
                <p className="text-xs text-gray-500 max-w-xs">
                    Signals feed and Pipeline views coming in Phase 4.
                </p>
            </div>
        </div>
    );
}
