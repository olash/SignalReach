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

function LoginGate() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [busy, setBusy] = useState(false);

    const inputCls =
        'w-full px-4 py-2.5 text-sm text-gray-900 bg-[#F9FAFB] border border-gray-200 rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all';

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (error) throw error;
                toast.success('Account created! Welcome to SignalReach.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast.success('Welcome back!');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Authentication failed';
            toast.error(msg);
        } finally {
            setBusy(false);
        }
    };

    const handleGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/dashboard` },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:radar-linear" class="text-2xl text-indigo-600" />
                    <span className="text-lg font-semibold text-gray-900 tracking-tight">SignalReach</span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-8">
                    {/* Heading */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isSignUp ? 'Create your account' : 'Welcome back'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1.5">
                            {isSignUp ? 'Start capturing leads in seconds.' : 'Sign in to your dashboard.'}
                        </p>
                    </div>

                    {/* Google */}
                    <button
                        onClick={handleGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-sm font-medium py-2.5 rounded-xl transition-colors mb-5 shadow-sm active:scale-[0.98]"
                    >
                        {/* @ts-expect-error custom element */}
                        <iconify-icon icon="logos:google-icon" class="text-xl" />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative mb-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-white text-gray-400">Or continue with email</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAuth} className="flex flex-col gap-4">
                        {isSignUp && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
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
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                            <input
                                type="password"
                                required
                                minLength={isSignUp ? 8 : 1}
                                placeholder={isSignUp ? 'Min. 8 characters' : '••••••••'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-1"
                        >
                            {busy ? (
                                /* @ts-expect-error custom element */
                                <iconify-icon icon="solar:spinner-linear" class="text-base animate-spin" />
                            ) : (
                                /* @ts-expect-error custom element */
                                <iconify-icon icon={isSignUp ? 'solar:user-plus-linear' : 'solar:login-2-linear'} class="text-base" />
                            )}
                            {busy ? 'Processing…' : (isSignUp ? 'Create Account' : 'Sign In')}
                        </button>
                    </form>

                    {/* Toggle */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        {isSignUp ? (
                            <>Already have an account?{' '}
                                <button onClick={() => setIsSignUp(false)} className="text-indigo-600 font-medium hover:underline">
                                    Sign In
                                </button>
                            </>
                        ) : (
                            <>No account?{' '}
                                <button onClick={() => setIsSignUp(true)} className="text-indigo-600 font-medium hover:underline">
                                    Create Account
                                </button>
                            </>
                        )}
                    </p>
                </div>
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
        supabase.auth.getSession().then(({ data }) => handleSession(data.session));
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
