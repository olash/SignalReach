'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Workspace {
    id: string;
    name: string;
    keywords: string | null;
    scrape_frequency: string | null;
}

interface WorkspaceContextValue {
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    setActiveWorkspace: (ws: Workspace) => void;
    loading: boolean;
    refetch: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WorkspaceContext = createContext<WorkspaceContextValue>({
    workspaces: [],
    activeWorkspace: null,
    setActiveWorkspace: () => { },
    loading: true,
    refetch: () => { },
});

export function useWorkspace() {
    return useContext(WorkspaceContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const LS_KEY = 'sr_active_workspace_id';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWorkspaces = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data, error } = await supabase
            .from('workspaces')
            .select('id, name, keywords, scrape_frequency')
            .eq('user_id', user.id)
            .order('id', { ascending: true });

        // ── Onboarding gate: authenticated but no workspace yet ──
        if (error || !data?.length) {
            // Only redirect if we're not already on /welcome to avoid loops
            if (pathname !== '/welcome') {
                router.push('/welcome');
            }
            setLoading(false);
            return;
        }

        setWorkspaces(data as Workspace[]);

        // Restore persisted selection, or fall back to first workspace
        const savedId = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
        const saved = savedId ? (data as Workspace[]).find((w) => w.id === savedId) : null;
        setActiveWorkspaceState(saved ?? (data[0] as Workspace));
        setLoading(false);
    }, [router, pathname]);

    useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

    const setActiveWorkspace = useCallback((ws: Workspace) => {
        setActiveWorkspaceState(ws);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LS_KEY, ws.id);
        }
    }, []);

    // ── Loading / gate spinner — prevents UI flash while checking ─────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
                {/* @ts-expect-error custom element */}
                <iconify-icon icon="solar:spinner-linear" class="text-3xl text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, loading, refetch: fetchWorkspaces }}>
            {children}
        </WorkspaceContext.Provider>
    );
}
