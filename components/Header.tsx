'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/WorkspaceContext';
import { useAuth } from '@/components/AuthContext';

export default function Header() {
    const router = useRouter();
    const { workspaces, activeWorkspace, setActiveWorkspace, loading } = useWorkspace();
    const { user } = useAuth();

    const displayName = (user?.user_metadata?.full_name as string | undefined) || user?.email || 'My Account';
    const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
    const initials = displayName.charAt(0).toUpperCase();

    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const wsRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close all dropdowns when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWorkspaceOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success('Logged out successfully');
        router.push('/');
    };

    const wsInitials = activeWorkspace?.name
        ? activeWorkspace.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
        : '…';

    return (
        <header className="h-16 shrink-0 flex items-center justify-between backdrop-blur-md bg-white/70 border-b border-gray-200 px-6 z-30">

            {/* ── Workspace Switcher ────────────────────────────────────────── */}
            <div className="relative" ref={wsRef}>
                <button
                    onClick={() => setWorkspaceOpen((o) => !o)}
                    disabled={loading}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                >
                    <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                        {wsInitials}
                    </div>
                    <span className="font-medium text-[#111827] max-w-[120px] truncate">
                        {loading ? 'Loading…' : (activeWorkspace?.name ?? 'No workspace')}
                    </span>
                    {/* @ts-expect-error custom element */}
                    <iconify-icon
                        icon="solar:alt-arrow-down-linear"
                        class={`text-gray-400 text-sm transition-transform duration-150 ${workspaceOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {workspaceOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Workspaces</p>
                        {workspaces.length === 0 && (
                            <p className="px-3 py-2 text-xs text-gray-400">No workspaces found.</p>
                        )}
                        {workspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => { setActiveWorkspace(ws); setWorkspaceOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${ws.id === activeWorkspace?.id ? 'text-indigo-600' : 'text-[#111827]'}`}
                            >
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${ws.id === activeWorkspace?.id ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                    {ws.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-medium truncate">{ws.name}</span>
                                {ws.id === activeWorkspace?.id && (
                                    /* @ts-expect-error custom element */
                                    <iconify-icon icon="solar:check-read-linear" class="text-indigo-600 text-sm ml-auto shrink-0" />
                                )}
                            </button>
                        ))}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                                onClick={() => toast('Workspace creation coming soon!', { icon: '🏢' })}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-[#111827] transition-colors"
                            >
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:add-circle-linear" class="text-gray-400 text-base" />
                                Add workspace
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right Actions ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-1">

                {/* Help */}
                <button
                    onClick={() => toast('Help center coming soon!', { icon: '❓' })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#111827] hover:bg-gray-100 transition-colors"
                >
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:question-circle-linear" class="text-lg" />
                </button>

                {/* ── Notification Bell ───────────────────────────────────── */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setNotifOpen((o) => !o)}
                        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#111827] hover:bg-gray-100 transition-colors"
                    >
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="solar:bell-linear" class="text-lg" />
                    </button>

                    {notifOpen && (
                        <div className="absolute top-full right-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-100 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                                <button
                                    onClick={() => setNotifOpen(false)}
                                    className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    Mark all read
                                </button>
                            </div>
                            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:bell-off-linear" class="text-gray-200 text-3xl" />
                                <p className="text-sm text-gray-400">No new notifications</p>
                                <p className="text-xs text-gray-300">We&apos;ll let you know when signals come in.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Profile Avatar ──────────────────────────────────────── */}
                <div className="relative ml-1" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen((o) => !o)}
                        className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold hover:ring-2 hover:ring-indigo-300 transition-all overflow-hidden border border-gray-200"
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-bold text-indigo-700">{initials}</span>
                        )}
                    </button>

                    {profileOpen && (
                        <div className="absolute top-full right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email ?? ''}</p>
                            </div>
                            <div className="py-1">
                                <Link
                                    href="/settings"
                                    onClick={() => setProfileOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#111827] transition-colors"
                                >
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:user-circle-linear" class="text-base text-gray-400" />
                                    Profile &amp; Settings
                                </Link>
                                <Link
                                    href="/settings"
                                    onClick={() => setProfileOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#111827] transition-colors"
                                >
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:card-linear" class="text-base text-gray-400" />
                                    Billing
                                </Link>
                            </div>
                            <div className="border-t border-gray-100 pt-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:logout-2-linear" class="text-base" />
                                    Log out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
