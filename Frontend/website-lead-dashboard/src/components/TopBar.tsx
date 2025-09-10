"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function titleFromPath(pathname: string | null) {
  if (!pathname) return "Dashboard";
  if (pathname === "/") return "Dashboard";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "Dashboard";
  // Simple mapping for known routes
  const map: Record<string, string> = {
    settings: "Settings",
    leads: "Leads",
    lead: "Lead",
    help: "Help",
  };
  const key = parts[0];
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [jobsCount, setJobsCount] = useState<number>(0);
  const [swActive, setSwActive] = useState<boolean>(false);

  useEffect(() => {
    // Detect service worker presence
    try {
      setSwActive(!!(navigator.serviceWorker && (navigator.serviceWorker.controller || navigator.serviceWorker.getRegistration)));
    } catch {
      setSwActive(false);
    }

    const readJobs = () => {
      try {
        const raw = localStorage.getItem("lead_jobs") || localStorage.getItem("lead_jobs_v1");
        if (!raw) return setJobsCount(0);
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return setJobsCount(parsed.length);
        if (parsed && typeof parsed.count === "number") return setJobsCount(parsed.count);
        return setJobsCount(0);
      } catch {
        setJobsCount(0);
      }
    };

    readJobs();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !["lead_jobs", "lead_jobs_v1", "lead_settings_v2", "lead_settings_v1"].includes(e.key)) return;
      readJobs();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <header className="w-full mb-6">
      <div className="rounded-2xl border border-gray-200 dark:border-[#0b1226] bg-white dark:bg-[#071226] shadow p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-gray-100 dark:bg-[#071426] text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-[#07203a]"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L6.414 9H17a1 1 0 110 2H6.414l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{titleFromPath(pathname)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Website Lead Dashboard</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-[#071426] border border-gray-100 dark:border-[#0b1226]">
            <span className={`h-2 w-2 rounded-full ${swActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-700 dark:text-gray-200">SW {swActive ? 'active' : 'inactive'}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 dark:bg-[#071426] border border-gray-100 dark:border-[#0b1226]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a5 5 0 11-10 0H4a2 2 0 01-2-2V5z" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-200">Jobs {jobsCount}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
