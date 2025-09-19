"use client";
import React, { useEffect, useState } from "react";
import { SelectedLead } from "@/context/SelectedLeadContext";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";

type Props = {
  lead?: SelectedLead | null;
  fallback?: { businessName?: string };
};

export default function LeadSummaryCard({ lead, fallback }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // simple appear animation
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, [lead?.id]);

  const typed = lead as SelectedLead | undefined;
  const name = typed?.company_name || fallback?.businessName || "—";
  const city = typed?.city || "";
  const phone = typed?.phone || "";
  const email = typed?.email || "";
  const website = typed?.website || "";
  const industry = typed?.industry || "";
  const contact = typed?.contact || "";
  const interested = typed?.interested;

  const router = useRouter();

  return (
    <div
      className={`card bg-base-100 shadow-lg transition-all duration-300 ease-out transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      aria-live="polite"
    >
      <div className="card-body">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="card-title text-xl">{name}</h3>
            <p className="text-sm opacity-70 mt-1">{industry || (city ? city : "")}</p>
          </div>
          <div className="text-sm">
            <div
              className={`badge ${
                interested === true
                  ? "badge-success"
                  : interested === false
                  ? "badge-error"
                  : "badge-ghost"
              }`}
            >
              {interested === true ? "Interested" : interested === false ? "Not interested" : "Unknown"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div>
              <div className="text-xs opacity-70">Contact</div>
              <div className="text-sm">{contact || "—"}</div>
            </div>

            <div>
              <div className="text-xs opacity-70">Phone</div>
              <div className="text-sm">{phone || "—"}</div>
            </div>

            <div>
              <div className="text-xs opacity-70">Email</div>
              <div className="text-sm truncate">{email || "—"}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <div className="text-xs opacity-70">City</div>
              <div className="text-sm">{city || "—"}</div>
            </div>

            <div>
              <div className="text-xs opacity-70">Website</div>
              <div className="text-sm text-info truncate">{website || "—"}</div>
            </div>
          </div>
        </div>

        <div className="card-actions justify-end mt-4">
          {typed?.id ? (
            <button
              onClick={() => {
                const leadObj = typed as SelectedLead;
                // prefer explicit slug, else generate from company_name, else use id
                const explicit = leadObj.slug && String(leadObj.slug).trim();
                const generated = !explicit && leadObj.company_name ? slugify(leadObj.company_name) : undefined;
                const finalSlug = explicit || generated || String(leadObj.id);
                router.push(`/lead/${encodeURIComponent(finalSlug)}`);
              }}
              className="btn btn-primary btn-sm"
              aria-label={`Open lead ${name}`}
            >
              Open
            </button>
          ) : (
            <button
              disabled
              className="btn btn-disabled btn-sm"
            >
              Open
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
