'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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

        if (error || !data?.length) { setLoading(false); return; }

        setWorkspaces(data as Workspace[]);

        // Restore persisted selection, or fall back to first workspace
        const savedId = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
        const saved = savedId ? (data as Workspace[]).find((w) => w.id === savedId) : null;
        setActiveWorkspaceState(saved ?? (data[0] as Workspace));
        setLoading(false);
    }, []);

    useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

    const setActiveWorkspace = useCallback((ws: Workspace) => {
        setActiveWorkspaceState(ws);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LS_KEY, ws.id);
        }
    }, []);

    return (
        <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, loading, refetch: fetchWorkspaces }}>
            {children}
        </WorkspaceContext.Provider>
    );
}
