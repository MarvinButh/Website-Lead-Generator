import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SelectedLeadProvider } from "@/context/SelectedLeadContext";
import React from "react";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <SelectedLeadProvider>{children}</SelectedLeadProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
