"use client";

import { useState, useEffect, useRef } from "react";

export default function LeadSearchForm() {
  // Prefer user overrides stored in localStorage over build-time env vars.
  const STORAGE_KEY = "lead_settings_v1";

  const envDefaultKeywords = process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || "";
  const envDefaultCity = process.env.NEXT_PUBLIC_DEFAULT_CITY || "";
  const envDefaultCountry = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "";
  const envDefaultUseOverpass = (process.env.NEXT_PUBLIC_DEFAULT_USE_OVERPASS || "false").toLowerCase() === "true";
  const envDefaultAutoFilter = (process.env.NEXT_PUBLIC_DEFAULT_AUTO_FILTER || "false").toLowerCase() === "true";

  const [keywords, setKeywords] = useState<string>(envDefaultKeywords);
  const [city, setCity] = useState<string>(envDefaultCity);
  const [countryCode, setCountryCode] = useState<string>(envDefaultCountry);
  const [useOverpass, setUseOverpass] = useState<boolean>(envDefaultUseOverpass);
  const [autoFilter, setAutoFilter] = useState<boolean>(envDefaultAutoFilter);

  // apiBase should also prefer user override
  const [apiBase, setApiBase] = useState<string>(process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000");
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [jobs, setJobs] = useState<Array<{ jobId: string; status: "pending" | "done" | "failed" }>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const o = parsed?.overrides;
        if (o) {
          if (typeof o.defaultKeywords === "string" && o.defaultKeywords.length) setKeywords(o.defaultKeywords);
          if (typeof o.defaultCity === "string" && o.defaultCity.length) setCity(o.defaultCity);
          if (typeof o.defaultCountryCode === "string" && o.defaultCountryCode.length) setCountryCode(o.defaultCountryCode);
          if (typeof o.defaultUseOverpass === "boolean") setUseOverpass(o.defaultUseOverpass);
          // defaultAutoFilter isn't part of overrides in current settings page; respect stored value if present
          if (typeof o.defaultAutoFilter === "boolean") setAutoFilter(o.defaultAutoFilter);
          if (typeof o.apiBase === "string" && o.apiBase.length) setApiBase(o.apiBase);
        }
      }
    } catch (err) {
      // ignore and keep env defaults
      console.debug("No user overrides loaded", err);
    }
  }, []);

  // Register service worker for background tasks. Located at /sw.js
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!('serviceWorker' in navigator)) return;

    let mounted = true;
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (!mounted) return;
      swRegistrationRef.current = reg;
      console.debug('Service worker registered', reg);
    }).catch((err) => console.debug('SW registration failed', err));

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;
      if (data.type === 'GENERATE_RESULT') {
        const { jobId, ok, data: payload, error } = data;
        setJobs((s) => s.map((j) => (j.jobId === jobId ? { ...j, status: ok ? 'done' : 'failed' } : j)));
        if (ok) {
          // update UI with result when worker finishes
          setResult({ inserted: payload.inserted ?? 0, found: payload.found ?? 0, filtered: payload.filtered, offers_generated: payload.offers_generated });
        } else {
          setError(error ?? `Worker request failed: ${data.status || 'unknown'}`);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, []);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { inserted: number; found: number; filtered?: number; offers_generated?: number }>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const payloadBody = { keywords, city, country_code: countryCode, use_overpass: useOverpass, auto_filter: autoFilter };

    // If service worker is available and active, hand off the job to the worker so it runs in background
    const swAvailable = !!(navigator.serviceWorker && (navigator.serviceWorker.controller || swRegistrationRef.current?.active));
    if (swAvailable) {
      const jobId = String(Date.now());
      setJobs((s) => [...s, { jobId, status: 'pending' }]);
      try {
        // send message to service worker
        const msg = { type: 'RUN_GENERATE', jobId, apiBase, body: payloadBody };
        // Prefer posting to the active worker
        const target = navigator.serviceWorker.controller || swRegistrationRef.current?.active;
        if (target) {
          (target as ServiceWorker).postMessage(msg);
        } else if (swRegistrationRef.current?.active) {
          swRegistrationRef.current.active.postMessage(msg);
        } else {
          throw new Error('No active service worker to receive message');
        }
      } catch (err) {
        setJobs((s) => s.map((j) => (j.jobId === String(Date.now()) ? { ...j, status: 'failed' } : j)));
        setError('Failed to start background job: ' + String(err));
      }
      // do not block UI; job runs in service worker
      return;
    }

    // Fallback: run inline as before
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/leads/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setResult({ inserted: data.inserted, found: data.found, filtered: data.filtered, offers_generated: data.offers_generated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate leads";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Keywords</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Comma-separated search tags"
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Country Code</label>
          <input
            type="text"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input type="checkbox" checked={useOverpass} onChange={(e) => setUseOverpass(e.target.checked)} /> Use OSM Overpass
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input type="checkbox" checked={autoFilter} onChange={(e) => setAutoFilter(e.target.checked)} /> Auto-filter & generate offers
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate leads"}
        </button>
      </div>

      {/* Show background jobs started via service worker */}
      {jobs.length > 0 && (
        <div className="mt-3 text-sm">
          <div className="font-medium">Background jobs</div>
          <ul className="mt-1 space-y-1">
            {jobs.map((j) => (
              <li key={j.jobId} className={`inline-flex items-center gap-2 ${j.status === 'pending' ? 'text-gray-600' : j.status === 'done' ? 'text-green-600' : 'text-red-600'}`}>
                <span className="font-mono text-xs">{j.jobId}</span>
                <span className="uppercase text-xs">{j.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Inserted {result.inserted} rows (found {result.found}).
          {typeof result.filtered === "number" || typeof result.offers_generated === "number" ? (
            <>
              {" "}Filtered {result.filtered ?? 0} leads, generated {result.offers_generated ?? 0} offers. Refresh the list above to see new leads.
            </>
          ) : (
            <> Refresh the list above to see new leads.</>
          )}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
