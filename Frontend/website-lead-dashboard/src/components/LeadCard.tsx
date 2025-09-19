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
    } catch {
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
      className={`card cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/40 border ${
        isSelected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-base-300 bg-base-100 hover:bg-base-200 shadow-md hover:border-primary/30"
      }`}
    >
      <div className="card-body p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="card-title text-lg font-semibold text-base-content mb-2">{lead.company_name}</h3>
            <div className="space-y-1">
              {lead.city && <p className="text-sm text-base-content/70 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {lead.city}
              </p>}
              {lead.industry && <p className="text-sm text-base-content/70 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {lead.industry}
              </p>}
              {lead.email && <p className="text-sm text-base-content/70 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {lead.email}
              </p>}
              {lead.phone && <p className="text-sm text-base-content/70 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {lead.phone}
              </p>}
            </div>
          </div>
          {isSelected && (
            <div className="badge badge-primary badge-lg">
              Selected
            </div>
          )}
        </div>
        <div className="card-actions justify-start mt-4 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setInterested(true);
          }}
          disabled={updating !== null || interestedState === true}
          className="btn btn-success btn-md font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {interestedState === true ? "✓ Interested" : updating === "interested" ? "..." : "Mark Interested"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setInterested(false);
          }}
          disabled={updating !== null || interestedState === false}
          className="btn btn-error btn-md font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {interestedState === false ? "✗ Discarded" : updating === "discard" ? "..." : "Discard"}
        </button>
        {lead.website && (
          <a
            onClick={(e) => e.stopPropagation()}
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.company_name + (lead.city ? ' ' + lead.city : ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-info btn-md font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            📍 Open Maps
          </a>
        )}
        </div>
      </div>
    </div>
  );
}
