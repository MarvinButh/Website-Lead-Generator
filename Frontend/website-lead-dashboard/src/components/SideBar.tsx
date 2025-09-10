"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, usePathname } from "next/navigation";

type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
};

export default function SideBar() {
  const { isDark, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const go = (path: string) => () => router.push(path);

  const items: NavItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z" />
        </svg>
      ),
      onClick: go("/"),
      isActive: pathname === "/",
    },
    {
      key: "settings",
      label: "Settings",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M19.14 12.94a7.49 7.49 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.52 7.52 0 00-1.63-.95l-.36-2.56A.5.5 0 0013.9 2h-3.8a.5.5 0 00-.49.42l-.36 2.56c-.58.23-1.13.54-1.63.95l-2.39-.96a.5.5 0 00-.6.22L2.71 8.09a.5.5 0 00.12.64l2.03 1.58c-.05.31-.08.63-.08.95s.03.64.08.95L2.83 13.8a.5.5 0 00-.12.64l1.92 3.32c.13.22.4.31.63.22l2.39-.96c.5.41 1.05.72 1.63.95l.36 2.56c.06.24.26.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.56c.58-.23 1.13-.54 1.63-.95l2.39.96c.23.09.5 0 .63-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1115.5 12 3.5 3.5 0 0112 15.5z" />
        </svg>
      ),
      onClick: go("/settings"),
      isActive: pathname === "/settings",
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {/* Top brand */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
          {/* Simple logo glyph */}
          <span className="text-lg font-bold">WL</span>
        </div>
        <div>
          <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Website</div>
          <div className="text-base font-semibold">Lead Dashboard</div>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800" />

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={item.onClick}
            className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 hover:dark:bg-gray-800 ${
              item.isActive ? "bg-gray-100 dark:bg-gray-800" : ""
            }`}
          >
            <span className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 group-hover:dark:text-gray-200">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-800" />

      {/* Bottom section: dark mode + help */}
      <div className="p-2">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100 hover:dark:bg-gray-800"
          aria-label="Toggle dark mode"
        >
          <span className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400" aria-hidden>
              {isDark ? (
                // Moon icon
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                // Sun icon
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm9-10v-2h-3v2h3zM17.24 4.84l1.42 1.42 1.79-1.8-1.41-1.41-1.8 1.79zM12 6a6 6 0 100 12A6 6 0 0012 6zm7.66 12.95l1.41 1.41 1.8-1.79-1.42-1.42-1.79 1.8zM4.84 17.24l-1.8 1.79 1.41 1.41 1.8-1.79-1.41-1.41z" />
                </svg>
              )}
            </span>
            <span>Dark mode</span>
          </span>
          <span
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isDark ? "bg-blue-600" : "bg-gray-300"
            }`}
            role="switch"
            aria-checked={isDark}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDark ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </span>
        </button>

        <div className="mt-2">
          <button
            onClick={go("/help")}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 hover:dark:bg-gray-800"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border text-xs">?</span>
            <span>Help</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
