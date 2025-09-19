import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SelectedLeadProvider } from "@/context/SelectedLeadContext";
import React from "react";
import TopBar from "@/components/TopBar";
import SideBar from "@/components/SideBar";
import PageTransition from "@/components/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Website Lead Dashboard",
  description: "Manage and view your website leads efficiently.",
};

const noFlash = `(() => {
  try {
    const storageKey = 'theme-preference';
    const stored = localStorage.getItem(storageKey);
    // Only use stored preference, default to light if none exists
    const isDark = stored === 'dark';
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  } catch {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <ThemeProvider>
          <SelectedLeadProvider>
            {/* Full screen dashboard layout */}
            <div className="h-full flex bg-base-100">
              {/* Compact sidebar */}
              <div className="flex-shrink-0">
                <SideBar />
              </div>

              {/* Main content area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <header className="border-b border-base-300 bg-base-100">
                  <TopBar />
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto bg-base-200/50">
                  <div className="p-6">
                    <PageTransition>
                      {children}
                    </PageTransition>
                  </div>
                </main>
              </div>
            </div>
          </SelectedLeadProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
