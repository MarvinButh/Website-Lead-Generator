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
      className={`w-full rounded-md border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm p-4 md:p-6 transition-all duration-300 ease-out transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold leading-tight">{name}</h3>
          <p className="text-sm text-gray-500 mt-1">{industry || (city ? city : "")}</p>
        </div>
        <div className="text-sm text-gray-600">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              interested === true
                ? "bg-green-100 text-green-800"
                : interested === false
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {interested === true ? "Interested" : interested === false ? "Not interested" : "Unknown"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="space-y-2">
          <div>
            <div className="text-xs text-gray-500">Contact</div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{contact || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Phone</div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{phone || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Email</div>
            <div className="text-sm text-gray-900 dark:text-gray-100 truncate">{email || "—"}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="text-xs text-gray-500">City</div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{city || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Website</div>
            <div className="text-sm text-blue-600 dark:text-blue-400 truncate">{website || "—"}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
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
            className="px-3 py-1 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={`Open lead ${name}`}
          >
            Open
          </button>
        ) : (
          <button
            disabled
            className="px-3 py-1 rounded border text-sm text-gray-400 cursor-not-allowed"
          >
            Open
          </button>
        )}
      </div>
    </div>
  );
}
