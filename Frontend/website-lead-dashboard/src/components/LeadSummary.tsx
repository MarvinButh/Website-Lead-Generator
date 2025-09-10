'use client';

import React from "react";
import Toast from "@/components/Toast";

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
  const [interestedState, setInterestedState] = React.useState<boolean | null>(interested ?? null);
  const [updating, setUpdating] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, [leadId]);

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

  const mapsQuery = address ? `${businessName} ${address}` : businessName + (city ? " " + city : "");

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY || "";
  const mapsEmbedSrc = mapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapsApiKey)}&q=${encodeURIComponent(mapsQuery)}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`;

  const [copied, setCopied] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [toast, setToast] = React.useState<{ id: string; message: string; type?: 'success'|'error' } | null>(null);

  const copyAddress = async () => {
    const text = address || mapsQuery;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToast({ id: 'copy', message: 'Address copied to clipboard', type: 'success' });
    } catch (err) {
      console.error('Copy failed', err);
      setToast({ id: 'copy-err', message: 'Failed to copy address', type: 'error' });
    }
  };

  const exportLead = () => {
    if (!leadId) return;
    setExporting(true);
    try {
      const payload = {
        id: leadId,
        businessName,
        phone,
        email,
        website,
        city,
        industry,
        contact,
        address,
        interested: interestedState,
        generatedAt,
      } as const;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lead-${leadId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast({ id: 'export', message: 'Exported lead JSON', type: 'success' });
    } catch (err) {
      console.error('Export failed', err);
      setToast({ id: 'export-err', message: 'Export failed', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  // wrap setInterested to show toast
  const setInterestedWithToast = async (val: boolean | null) => {
    await setInterested(val);
    if (val === true) setToast({ id: 'intr', message: 'Marked as interested', type: 'success' });
    if (val === false) setToast({ id: 'disc', message: 'Marked as not interested', type: 'error' });
  };

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  return (
    <div className="bg-transparent p-0">
      <main className={`w-full max-w-full`}> 
        <section
          className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow transition-transform duration-300 ease-out transform ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{businessName}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lead summary</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{city || ""}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  interestedState === true
                    ? "bg-green-100 text-green-800"
                    : interestedState === false
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {interestedState === true ? "Interested" : interestedState === false ? "Not interested" : "Unknown"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: details & scripts */}
              <div className="col-span-2">
                <div className="grid gap-3 text-gray-800 dark:text-gray-100">
                  {(phone || phoneHref) && (
                    <div>
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {phoneHref ? (
                          <a className="text-blue-600 dark:text-blue-400 hover:underline" href={phoneHref}>{phone}</a>
                        ) : (
                          <span>{phone}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {(email || emailHref) && (
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {emailHref ? (
                          <a className="text-blue-600 dark:text-blue-400 hover:underline" href={emailHref}>{email}</a>
                        ) : (
                          <span>{email}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {(website || websiteHref) && (
                    <div>
                      <div className="text-xs text-gray-500">Website</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {websiteHref ? (
                          <a target="_blank" rel="noopener noreferrer" href={websiteHref} className="hover:underline">{website}</a>
                        ) : (
                          <span>{website}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {(contact || city || industry) && (
                    <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                      {contact && <li><span className="font-medium">Contact:</span> {contact}</li>}
                      {city && <li><span className="font-medium">City:</span> {city}</li>}
                      {industry && <li><span className="font-medium">Industry:</span> {industry}</li>}
                    </ul>
                  )}

                  <div className="mt-4 space-y-3">
                    {emailScript && (
                      <details className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                        <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100">Cold email (click to expand)</summary>
                        <pre className="mt-2 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded text-sm text-gray-800 dark:text-gray-100 font-mono overflow-x-auto">{emailScript}</pre>
                      </details>
                    )}

                    {phoneScript && (
                      <details className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                        <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100">Cold phone script (click to expand)</summary>
                        <pre className="mt-2 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded text-sm text-gray-800 dark:text-gray-100 font-mono overflow-x-auto">{phoneScript}</pre>
                      </details>
                    )}
                  </div>

                  {generatedAt && <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Generated {generatedAt}</p>}

                  {/* Primary actions: kept minimal on the left; moved major actions to the right column */}
                  <div className="mt-4">
                    {/* left column intentionally minimal; actions moved to the map column for clarity */}
                  </div>
                 </div>
               </div>
 
               {/* Right: maps widget */}
               <aside className="col-span-1">
                 <div className="w-full h-64 md:h-80 rounded-md overflow-hidden border border-gray-100 dark:border-gray-800">
                   <iframe
                     title={`Map for ${businessName}`}
                     src={mapsEmbedSrc}
                     className="w-full h-full border-0"
                     loading="lazy"
                     referrerPolicy="no-referrer-when-downgrade"
                   />
                 </div>
 
                 <div className="mt-4 space-y-2">
                   <a
                     href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-full inline-flex items-center justify-center rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                   >
                     Get Directions
                   </a>
                   <a
                     href={mapsLink}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-full inline-flex items-center justify-center rounded border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                   >
                     View on Google Maps
                   </a>

                   {/* Action buttons restored: Interested / Discard / Clear / Export / Copy */}
                   <div className="mt-2 grid grid-cols-1 gap-2">
                     <button
                       type="button"
                       onClick={() => setInterestedWithToast(true)}
                       disabled={!!updating || !leadId}
                       className={`w-full inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium text-white ${interestedState === true ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'} ${!!updating ? 'opacity-60 cursor-not-allowed' : ''}`}
                     >
                       {updating === 'interested' ? 'Working...' : 'Mark Interested'}
                     </button>

                     <button
                       type="button"
                       onClick={() => setInterestedWithToast(false)}
                       disabled={!!updating || !leadId}
                       className={`w-full inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium text-white ${interestedState === false ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} ${!!updating ? 'opacity-60 cursor-not-allowed' : ''}`}
                     >
                       {updating === 'discard' ? 'Working...' : 'Mark Not Interested'}
                     </button>

                     <button
                       type="button"
                       onClick={() => setInterestedWithToast(null)}
                       disabled={!!updating || !leadId}
                       className={`w-full inline-flex items-center justify-center rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 ${!!updating ? 'opacity-60 cursor-not-allowed' : ''}`}
                     >
                       {updating === 'clear' ? 'Working...' : 'Clear Status'}
                     </button>

                     <button
                       type="button"
                       onClick={exportLead}
                       disabled={exporting || !leadId}
                       className={`w-full inline-flex items-center justify-center rounded border px-3 py-2 text-sm font-medium ${exporting ? 'opacity-60 cursor-not-allowed' : ''}`}
                     >
                       {exporting ? 'Exporting...' : 'Export'}
                     </button>

                     <button
                       type="button"
                       onClick={copyAddress}
                       disabled={!address && !mapsQuery}
                       className={`w-full inline-flex items-center justify-center rounded border px-3 py-2 text-sm font-medium ${copied ? 'bg-gray-100 text-gray-500' : ''}`}
                     >
                       {copied ? 'Copied' : 'Copy Address'}
                     </button>
                   </div>
                 </div>
               </aside>
             </div>
           </div>
         </section>
       </main>

      {toast && (
        <Toast
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
