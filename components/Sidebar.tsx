'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type NavItem = {
    label: string;
    href?: string;
    icon: string;
    children?: { label: string; href: string; icon: string }[];
};

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: 'solar:home-2-linear' },
    { label: 'Signals', href: '/signals', icon: 'solar:radar-linear' },
    { label: 'Pipelines', href: '/pipelines', icon: 'solar:chart-2-linear' },
    { label: 'Inbox', href: '/inbox', icon: 'solar:inbox-linear' },
    {
        label: 'Settings',
        icon: 'solar:settings-linear',
        children: [
            { label: 'Account', href: '/settings', icon: 'solar:user-circle-linear' },
            { label: 'Billing', href: '/settings', icon: 'solar:card-linear' },
            { label: 'Integrations', href: '/settings', icon: 'solar:plug-circle-linear' },
            { label: 'Team', href: '/settings', icon: 'solar:users-group-rounded-linear' },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    const toggleAccordion = (label: string) => {
        setOpenAccordion((prev) => (prev === label ? null : label));
    };

    const isActive = (href?: string) => href && pathname.startsWith(href);

    const handleLogout = async () => {
        setLoggingOut(true);
        await supabase.auth.signOut();
        toast.success('Logged out successfully');
        router.push('/');
    };

    return (
        <aside className="flex flex-col w-64 shrink-0 h-screen bg-white border-r border-gray-200 overflow-y-auto">
            {/* Branding */}
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:radar-linear" class="text-white text-base" />
                </div>
                <span className="font-semibold text-[#111827] tracking-tight text-base">SignalReach</span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
                {navItems.map((item) => {
                    if (item.children) {
                        const isOpen = openAccordion === item.label;
                        const anyChildActive = item.children.some((c) => pathname.startsWith(c.href));

                        return (
                            <div key={item.label}>
                                <button
                                    onClick={() => toggleAccordion(item.label)}
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${anyChildActive
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* @ts-expect-error custom element */}
                                        <iconify-icon
                                            icon={item.icon}
                                            class={`text-lg ${anyChildActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                                        />
                                        {item.label}
                                    </div>
                                    <svg
                                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <div
                                    className="overflow-hidden transition-all duration-200 ease-in-out"
                                    style={{
                                        maxHeight: isOpen ? `${item.children.length * 44}px` : '0px',
                                        opacity: isOpen ? 1 : 0,
                                    }}
                                >
                                    <div className="ml-3 pl-3 border-l border-gray-100 flex flex-col gap-0.5 py-1">
                                        {item.children.map((child) => (
                                            <Link
                                                key={`${child.href}-${child.label}`}
                                                href={child.href}
                                                prefetch={false}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${pathname === child.href
                                                        ? 'text-indigo-600 bg-indigo-50 font-medium'
                                                        : 'text-gray-500 hover:text-[#111827] hover:bg-gray-50'
                                                    }`}
                                            >
                                                {/* @ts-expect-error custom element */}
                                                <iconify-icon
                                                    icon={child.icon}
                                                    class={`text-base ${pathname === child.href ? 'text-indigo-600' : 'text-gray-400'}`}
                                                />
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href!}
                            prefetch={false}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${isActive(item.href)
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'
                                }`}
                        >
                            {/* @ts-expect-error custom element */}
                            <iconify-icon
                                icon={item.icon}
                                class={`text-lg ${isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                            />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="px-3 py-4 border-t border-gray-100 flex flex-col gap-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
                        SR
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#111827] truncate">Sarah Reynolds</p>
                        <p className="text-[10px] text-gray-400 truncate">sarah@acmecorp.io</p>
                    </div>
                </div>

                {/* Log out button */}
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50 w-full"
                >
                    {/* @ts-expect-error custom element */}
                    <iconify-icon
                        icon={loggingOut ? 'solar:refresh-linear' : 'solar:logout-2-linear'}
                        class={`text-lg ${loggingOut ? 'animate-spin' : ''}`}
                    />
                    {loggingOut ? 'Logging out…' : 'Log Out'}
                </button>
            </div>
        </aside>
    );
}
