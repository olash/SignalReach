'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    session: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

// ─── Login Gate ───────────────────────────────────────────────────────────────

type LoginTab = 'magic' | 'password';

function LoginGate() {
    const [tab, setTab] = useState<LoginTab>('magic');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [magicSent, setMagicSent] = useState(false);

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setBusy(true);
        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        setBusy(false);
        if (error) {
            toast.error(error.message);
        } else {
            setMagicSent(true);
        }
    };

    const handleEmailPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) return;
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });
        setBusy(false);
        if (error) toast.error(error.message);
        // On success the onAuthStateChange listener in AuthProvider re-renders automatically
    };

    const tabCls = (t: LoginTab) =>
        `flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${tab === t
            ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
            : 'text-gray-500 hover:text-gray-900'
        }`;

    const inputCls =
        'w-full px-3.5 py-2.5 text-sm text-gray-900 bg-[#F9FAFB] border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-200';

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
            <div className="w-full max-w-sm">

                {/* Logo / wordmark */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:radar-linear" class="text-2xl text-indigo-600" />
                    <span className="text-lg font-semibold text-gray-900 tracking-tight">
                        SignalReach
                    </span>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-8 py-8">
                    <h1 className="text-xl font-semibold text-gray-900 mb-1 text-center">
                        Welcome back
                    </h1>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Sign in to your workspace
                    </p>

                    {/* Tab switcher */}
                    <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-1 gap-1 mb-6">
                        <button onClick={() => { setTab('magic'); setMagicSent(false); }} className={tabCls('magic')}>
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:magic-stick-3-linear" class="mr-1.5 align-middle" />
                            Magic Link
                        </button>
                        <button onClick={() => { setTab('password'); setMagicSent(false); }} className={tabCls('password')}>
                            {/* @ts-expect-error custom element */}
                            <iconify-icon icon="solar:lock-password-linear" class="mr-1.5 align-middle" />
                            Password
                        </button>
                    </div>

                    {/* ── Magic Link ── */}
                    {tab === 'magic' && (
                        <>
                            {magicSent ? (
                                <div className="flex flex-col items-center gap-3 py-4 text-center">
                                    {/* @ts-expect-error custom element */}
                                    <iconify-icon icon="solar:letter-opened-linear" class="text-4xl text-indigo-500" />
                                    <p className="text-sm font-medium text-gray-900">Check your inbox</p>
                                    <p className="text-xs text-gray-500">
                                        We sent a magic link to <span className="font-medium text-gray-700">{email}</span>.
                                        Click it to sign in instantly.
                                    </p>
                                    <button
                                        onClick={() => setMagicSent(false)}
                                        className="text-xs text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors mt-1"
                                    >
                                        Try a different email
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                            Email address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            autoFocus
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {busy ? (
                                            /* @ts-expect-error custom element */
                                            <iconify-icon icon="solar:spinner-linear" class="text-base animate-spin" />
                                        ) : (
                                            /* @ts-expect-error custom element */
                                            <iconify-icon icon="solar:letter-linear" class="text-base" />
                                        )}
                                        {busy ? 'Sending…' : 'Send Magic Link'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    {/* ── Email + Password ── */}
                    {tab === 'password' && (
                        <form onSubmit={handleEmailPassword} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                            >
                                {busy ? (
                                    /* @ts-expect-error custom element */
                                    <iconify-icon icon="solar:spinner-linear" class="text-base animate-spin" />
                                ) : (
                                    /* @ts-expect-error custom element */
                                    <iconify-icon icon="solar:login-2-linear" class="text-base" />
                                )}
                                {busy ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400 mt-5">
                    No account?{' '}
                    <a href="/welcome" className="text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 transition-colors">
                        Start onboarding
                    </a>
                </p>
            </div>
        </div>
    );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function FullPageSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
            {/* @ts-expect-error custom element */}
            <iconify-icon icon="solar:spinner-linear" class="text-3xl text-indigo-500 animate-spin" />
        </div>
    );
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const handleSession = useCallback((s: Session | null) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
    }, []);

    useEffect(() => {
        // Hydrate on mount
        supabase.auth.getSession().then(({ data }) => handleSession(data.session));

        // Subscribe to future changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            handleSession(s);
        });

        return () => subscription.unsubscribe();
    }, [handleSession]);

    if (loading) return <FullPageSpinner />;

    return (
        <AuthContext.Provider value={{ user, session, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── AuthGate — placed in dashboard layout only ───────────────────────────────

export function AuthGate({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <FullPageSpinner />;
    if (!user) return <LoginGate />;
    return <>{children}</>;
}
