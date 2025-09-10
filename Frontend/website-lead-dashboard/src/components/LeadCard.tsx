"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSelectedLead } from "@/context/SelectedLeadContext";
import { slugify } from "@/lib/slug";

type Lead = {
  id: number;
  company_name: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  industry?: string | null;
  contact?: string | null;
};

export default function LeadCard({ lead, noNavigate }: { lead: Lead; noNavigate?: boolean }) {
  const router = useRouter();
  const { setSelectedLead, selectedLead } = useSelectedLead();
  const [updating, setUpdating] = React.useState<string | null>(null);
  const [interestedState, setInterestedState] = React.useState<boolean | null>(
    (lead as unknown as { interested?: boolean | null }).interested ?? null
  );

  const slug = slugify(lead.company_name);

  const isSelected = selectedLead?.id === lead.id;

  const onClick = () => {
    setSelectedLead({ ...lead, slug });
    if (!noNavigate) router.push(`/lead/${slug}`);
  };

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const setInterested = async (val: boolean | null) => {
    setUpdating(val === true ? "interested" : val === false ? "discard" : "clear");
    try {
      const res = await fetch(`${apiBase}/leads/${lead.id}/interested`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interested: val }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const j = await res.json();
      if (j.ok) {
        setInterestedState(j.interested ?? null);
        // Notify listeners (page) that a lead was updated so lists can update optimistically
        try {
          window.dispatchEvent(new CustomEvent("lead-updated", { detail: { id: lead.id, interested: j.interested ?? null } }));
        } catch {
          // ignore on non-browser envs
        }
      }
    } catch (_e) {
      // ignore
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div
      id={`lead-${lead.id}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`text-left w-full rounded-lg border p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer ${
        isSelected
          ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-gray-800"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800"
      }`}
    >
      <div className="font-medium truncate">{lead.company_name}</div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
        {[lead.city, lead.industry, lead.email, lead.phone].filter(Boolean).join(" • ")}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setInterested(true);
          }}
          disabled={updating !== null || interestedState === true}
          className="inline-flex items-center justify-center rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {interestedState === true ? "Interested" : updating === "interested" ? "..." : "Mark Interested"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setInterested(false);
          }}
          disabled={updating !== null || interestedState === false}
          className="inline-flex items-center justify-center rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {interestedState === false ? "Discarded" : updating === "discard" ? "..." : "Discard"}
        </button>
        {lead.website && (
          <a
            onClick={(e) => e.stopPropagation()}
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.company_name + (lead.city ? ' ' + lead.city : ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            Open Maps
          </a>
        )}
      </div>
    </div>
  );
}
