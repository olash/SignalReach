'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

type NavItem = {
    label: string;
    href?: string;
    icon: string;
    children?: { label: string; href: string; icon: string }[];
};

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: 'solar:home-2-linear' },
    { label: 'Signals', href: '/signals', icon: 'solar:radar-linear' },
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

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
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

    // ── Derive user display info ─────────────────────────────────────────────
    const displayName =
        (user?.user_metadata?.full_name as string | undefined) ||
        user?.email?.split('@')[0] ||
        'User';
    const email = user?.email ?? '';
    const initials = displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            {/* Mobile overlay backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 md:relative md:translate-x-0 flex flex-col shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Branding — matches Dashboard.html logo block exactly */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-transparent">
                    <span className="font-extrabold tracking-tight text-lg text-gray-900 uppercase">SignalReach</span>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-gray-900">
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="solar:close-circle-linear" class="text-xl" />
                    </button>
                </div>

                {/* Navigation — matches Dashboard.html nav */}
                <nav className="px-3 mt-6 space-y-1 flex-1">
                    {navItems.map((item) => {
                        if (item.children) {
                            const isOpen = openAccordion === item.label;
                            const anyChildActive = item.children.some((c) => pathname.startsWith(c.href));

                            return (
                                <div key={item.label}>
                                    <button
                                        onClick={() => toggleAccordion(item.label)}
                                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 group ${anyChildActive
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* @ts-expect-error custom element */}
                                            <iconify-icon
                                                icon={item.icon}
                                                class={`text-lg ${anyChildActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
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
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-200 ${pathname === child.href
                                                        ? 'text-gray-900 bg-gray-100 font-medium'
                                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {/* @ts-expect-error custom element */}
                                                    <iconify-icon
                                                        icon={child.icon}
                                                        class={`text-base ${pathname === child.href ? 'text-blue-600' : 'text-gray-400'}`}
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
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 group ${isActive(item.href)
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {/* @ts-expect-error custom element */}
                                <iconify-icon
                                    icon={item.icon}
                                    class={`text-lg ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile & Status — mirrors Dashboard.html bottom panel */}
                <div className="p-5 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4 cursor-pointer group">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shadow-sm group-hover:shadow transition-shadow shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{email}</p>
                        </div>
                    </div>

                    {/* API Health Status */}
                    <div className="flex items-center justify-between px-3 py-2 mb-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">System Status</span>
                        </div>
                        <span className="text-[10px] font-medium text-emerald-600">Online</span>
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
        </>
    );
}
