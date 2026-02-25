'use client';

import { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { AuthGate } from "@/components/AuthContext";
import { WorkspaceProvider } from "@/components/WorkspaceContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AuthGate>
            <WorkspaceProvider>
                <div className="h-screen overflow-hidden flex bg-[#F9FAFB]">
                    <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                    <div className="flex flex-col flex-1 min-w-0 overflow-hidden w-full">
                        {/* Mobile Header (only visible on mobile) */}
                        <div className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 shrink-0">
                            <span className="font-extrabold tracking-tight text-lg text-gray-900 uppercase">SignalReach</span>
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="text-gray-500 hover:text-gray-900 flex items-center justify-center p-1"
                            >
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:hamburger-menu-linear" class="text-2xl" />
                            </button>
                        </div>
                        <Header />
                        <main className="flex-1 overflow-y-auto p-6">{children}</main>
                    </div>
                </div>
            </WorkspaceProvider>
        </AuthGate>
    );
}


