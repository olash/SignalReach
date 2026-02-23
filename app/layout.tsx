import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { AuthProvider } from "@/components/AuthContext";

export const metadata: Metadata = {
    title: "SignalReach | Intent-Based Outreach",
    description:
        "Stop spamming. Start listening. Shift from bulk cold outreach to signal-based intent capture.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            {/* Iconify Solar icon set via CDN */}
            <Script
                src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"
                strategy="beforeInteractive"
            />
            <body className="antialiased text-[#111827] selection:bg-indigo-100 selection:text-indigo-900">
                {/* Global Toaster — top-right */}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            fontFamily: "Inter, sans-serif",
                            fontSize: "13px",
                            borderRadius: "10px",
                            border: "1px solid #E5E7EB",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                        },
                        success: {
                            iconTheme: { primary: "#4F46E5", secondary: "#fff" },
                        },
                    }}
                />

                {/* AuthProvider makes session available everywhere.
                    The auth GATE lives in (dashboard)/layout.tsx only. */}
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}

