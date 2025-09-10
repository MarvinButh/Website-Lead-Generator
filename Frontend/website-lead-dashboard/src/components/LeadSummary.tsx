'use client';

import React from "react";

export type LeadSummaryProps = {
  businessName: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  industry?: string;
  contact?: string;
  address?: string; // added: full address for maps
  phoneScript?: string; // contents of cold_phone_call.md
  emailScript?: string; // contents of cold_email.md
  generatedAt?: string;
  // New: optional lead id and interested state for client-side actions
  leadId?: number;
  interested?: boolean | null;
};

export function LeadSummary({
  businessName,
  phone,
  email,
  website,
  city,
  industry,
  contact,
  address,
  phoneScript,
  emailScript,
  generatedAt,
  leadId,
  interested,
}: LeadSummaryProps) {
  const [interestedState, setInterestedState] = React.useState<boolean | null>(
    interested ?? null
  );
  const [updating, setUpdating] = React.useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const setInterested = async (val: boolean | null) => {
    if (!leadId) return;
    setUpdating(val === true ? "interested" : val === false ? "discard" : "clear");
    try {
      const res = await fetch(`${apiBase}/leads/${leadId}/interested`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interested: val }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const j = await res.json();
      if (j.ok) setInterestedState(j.interested ?? null);
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  };

  const phoneHref = phone ? `tel:${phone.replace(/[^0-9+]+/g, "")}` : "";
  const emailHref = email ? `mailto:${email}` : "";
  const websiteHref = website && !/^https?:\/\//i.test(website) ? `http://${website}` : website || "";

  const mapsQuery = address ? `${businessName} ${address}` : businessName + (city ? ' ' + city : '');

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-xl">
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow">
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{businessName}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lead summary</p>

            <div className="mt-6 grid gap-3 text-gray-800 dark:text-gray-100">
              {(phone || phoneHref) && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Phone:</span>{" "}
                  {phoneHref ? (
                    <a className="text-blue-600 dark:text-blue-400 hover:underline" href={phoneHref}>
                      {phone}
                    </a>
                  ) : (
                    <span>{phone}</span>
                  )}
                </div>
              )}

              {(email || emailHref) && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>{" "}
                  {emailHref ? (
                    <a className="text-blue-600 dark:text-blue-400 hover:underline" href={emailHref}>
                      {email}
                    </a>
                  ) : (
                    <span>{email}</span>
                  )}
                </div>
              )}

              {(website || websiteHref) && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Website:</span>{" "}
                  {websiteHref ? (
                    <a
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={websiteHref}
                    >
                      {website}
                    </a>
                  ) : (
                    <span>{website}</span>
                  )}
                </div>
              )}
            </div>

            {(contact || city || industry) && (
              <ul className="mt-6 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                {contact && (
                  <li>
                    <span className="font-medium">Contact:</span> {contact}
                  </li>
                )}
                {city && (
                  <li>
                    <span className="font-medium">City:</span> {city}
                  </li>
                )}
                {industry && (
                  <li>
                    <span className="font-medium">Industry:</span> {industry}
                  </li>
                )}
              </ul>
            )}

            <div className="mt-6 space-y-3">
              {emailScript && (
                <details className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100">
                    Cold email (click to expand)
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded text-sm text-gray-800 dark:text-gray-100 font-mono overflow-x-auto">
                    {emailScript}
                  </pre>
                </details>
              )}

              {phoneScript && (
                <details className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100">
                    Cold phone script (click to expand)
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded text-sm text-gray-800 dark:text-gray-100 font-mono overflow-x-auto">
                    {phoneScript}
                  </pre>
                </details>
              )}
            </div>

            {generatedAt && (
              <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">Generated {generatedAt}</p>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setInterested(true)}
                disabled={!leadId || updating !== null || interestedState === true}
                className="inline-flex items-center justify-center rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {interestedState === true ? "Interested" : updating === "interested" ? "..." : "Mark Interested"}
              </button>
              <button
                onClick={() => setInterested(false)}
                disabled={!leadId || updating !== null || interestedState === false}
                className="inline-flex items-center justify-center rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {interestedState === false ? "Discarded" : updating === "discard" ? "..." : "Discard"}
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Open Maps
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LeadSummary;
