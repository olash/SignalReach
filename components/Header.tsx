"use client";

import { useState, useRef, useEffect } from "react";

const workspaces = [
    { id: "1", name: "Acme Corp", initials: "AC" },
    { id: "2", name: "Globex Inc", initials: "GI" },
    { id: "3", name: "Initech", initials: "IN" },
];

export default function Header() {
    const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    const [hasNotifications] = useState(true);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setWorkspaceOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="h-14 shrink-0 flex items-center justify-between bg-white border-b border-gray-200 px-5 z-30">
            {/* Left: Workspace Switcher */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setWorkspaceOpen((o) => !o)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm"
                >
                    {/* Workspace Avatar */}
                    <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                        {activeWorkspace.initials}
                    </div>
                    <span className="font-medium text-[#111827] max-w-[120px] truncate">
                        {activeWorkspace.name}
                    </span>
                    {/* @ts-expect-error custom element */}
                    <iconify-icon
                        icon="solar:alt-arrow-down-linear"
                        class={`text-gray-400 text-sm transition-transform duration-150 ${workspaceOpen ? "rotate-180" : ""}`}
                    />
                </button>

                {/* Dropdown */}
                {workspaceOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Workspaces
                        </p>
                        {workspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => {
                                    setActiveWorkspace(ws);
                                    setWorkspaceOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${ws.id === activeWorkspace.id ? "text-indigo-600" : "text-[#111827]"
                                    }`}
                            >
                                <div
                                    className={`w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${ws.id === activeWorkspace.id ? "bg-indigo-600" : "bg-gray-300"
                                        }`}
                                >
                                    {ws.initials}
                                </div>
                                <span className="font-medium truncate">{ws.name}</span>
                                {ws.id === activeWorkspace.id && (
                                    /* @ts-expect-error custom element */
                                    <iconify-icon
                                        icon="solar:check-read-linear"
                                        class="text-indigo-600 text-sm ml-auto shrink-0"
                                    />
                                )}
                            </button>
                        ))}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-[#111827] transition-colors">
                                {/* @ts-expect-error custom element */}
                                <iconify-icon icon="solar:add-circle-linear" class="text-gray-400 text-base" />
                                Add workspace
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                {/* Help */}
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#111827] hover:bg-gray-100 transition-colors">
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:question-circle-linear" class="text-lg" />
                </button>

                {/* Notification Bell */}
                <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#111827] hover:bg-gray-100 transition-colors">
                    {/* @ts-expect-error custom element */}
                    <iconify-icon icon="solar:bell-linear" class="text-lg" />
                    {hasNotifications && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                    )}
                </button>

                {/* User Avatar */}
                <button className="ml-1 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold hover:ring-2 hover:ring-indigo-300 transition-all">
                    SR
                </button>
            </div>
        </header>
    );
}
