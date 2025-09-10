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
    const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const isDark = stored ? stored === 'dark' : !!(mql && mql.matches);
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
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
            {/* outer container centers the entire app block and uses full height */}
            <div className="h-full flex justify-center bg-background text-foreground">
              <div className="w-full max-w-7xl px-4 h-full flex flex-col">
                <header className="sticky top-0 z-40">
                  <TopBar />
                </header>

                {/* content area: fixed sidebar + scrollable main */}
                <div className="flex flex-1 overflow-hidden">
                  <div className="flex-shrink-0">
                    <SideBar />
                  </div>

                  <main className="flex-1 w-full overflow-auto">
                    <PageTransition>
                      {children}
                    </PageTransition>
                  </main>
                </div>
              </div>
            </div>
          </SelectedLeadProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
