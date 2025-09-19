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
    <div className="h-16 px-6 flex items-center justify-between">
      {/* Left side - Page title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-base-content">
          {titleFromPath(pathname)}
        </h1>
        <div className="text-sm text-base-content/60">
          Website Lead Dashboard
        </div>
      </div>

      {/* Right side - Status indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-base-200 rounded-lg">
          <div className={`w-2 h-2 rounded-full ${swActive ? 'bg-success' : 'bg-warning'}`} />
          <span className="text-xs font-medium">SW {swActive ? 'Active' : 'Inactive'}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-base-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a5 5 0 11-10 0H4a2 2 0 01-2-2V5z" />
          </svg>
          <span className="text-xs font-medium">Jobs {jobsCount}</span>
        </div>
      </div>
    </div>
  );
}
