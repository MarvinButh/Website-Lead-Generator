"use client";

import { useState, useEffect, useRef } from "react";
import GoogleKeyModal from "./GoogleKeyModal";
import Toast from "./Toast";
import { STORAGE_KEY as SETTINGS_KEY, readOverrides, setOverrides, getGooglePlacesKeyFromSettings } from "../lib/settings";

export default function LeadSearchForm() {
  // Prefer user overrides stored in localStorage over build-time env vars.
  const STORAGE_KEY = SETTINGS_KEY; // keep using shared key

  const envDefaultKeywords = process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || "";
  const envDefaultCity = process.env.NEXT_PUBLIC_DEFAULT_CITY || "";
  const envDefaultCountry = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "";
  const envDefaultUseOverpass = (process.env.NEXT_PUBLIC_DEFAULT_USE_OVERPASS || "false").toLowerCase() === "true";
  const envDefaultAutoFilter = (process.env.NEXT_PUBLIC_DEFAULT_AUTO_FILTER || "false").toLowerCase() === "true";
  // Determine Google Places API key. Prefer a key saved in the user's settings (localStorage) over a build-time env var.
  const getStoredGoogleKey = (): string => getGooglePlacesKeyFromSettings();

  // Persisted and editable Google key stored in component state
  const [googleKey, setGoogleKey] = useState<string>(() => getStoredGoogleKey() || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "");
  const googleAvailable = googleKey.length > 0;

  // Helper to merge overrides into storage
  const saveOverrides = (upserts: Record<string, unknown>) => setOverrides(upserts);

  // Modal state for entering the API key
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState<string>(googleKey);

  // Prefer overrides for all user-facing defaults
  const overrides = (typeof window !== 'undefined') ? readOverrides() : {};
  const defaultProvider: "overpass" | "google" = (typeof overrides.defaultUseOverpass === 'boolean')
    ? (overrides.defaultUseOverpass ? 'overpass' : (googleAvailable ? 'google' : 'overpass'))
    : (envDefaultUseOverpass ? 'overpass' : (googleAvailable ? 'google' : 'overpass'));

  // Resolve template language from settings (fallback to env or 'en')
  const templateLang = (typeof overrides.templateLang === 'string' && overrides.templateLang.trim().length)
    ? String(overrides.templateLang)
    : (process.env.NEXT_PUBLIC_TEMPLATE_LANG || 'en');

  const [keywords, setKeywords] = useState<string>(typeof overrides.defaultKeywords === 'string' && overrides.defaultKeywords.length ? overrides.defaultKeywords : envDefaultKeywords);
  const [city, setCity] = useState<string>(typeof overrides.defaultCity === 'string' && overrides.defaultCity.length ? overrides.defaultCity : envDefaultCity);
  const [countryCode, setCountryCode] = useState<string>(typeof overrides.defaultCountryCode === 'string' && overrides.defaultCountryCode.length ? overrides.defaultCountryCode : envDefaultCountry);
  // searchProvider controls whether to use 'google' or 'overpass'
  const [searchProvider, setSearchProvider] = useState<"overpass" | "google">(defaultProvider);
  const [autoFilter, setAutoFilter] = useState<boolean>(typeof overrides.defaultAutoFilter === 'boolean' ? overrides.defaultAutoFilter : envDefaultAutoFilter);

  // apiBase should also prefer user override
  const [apiBase, setApiBase] = useState<string>(typeof overrides.apiBase === 'string' && overrides.apiBase.length ? String(overrides.apiBase) : (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"));
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [jobs, setJobs] = useState<Array<{ jobId: string; status: "pending" | "done" | "failed" }>>([]);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    try {
      // Try v2 first, fall back to v1 for older installs
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("lead_settings_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        const o = parsed?.overrides || parsed?.overrides; // overrides expected in both v2 and v1
        if (o) {
          if (typeof o.defaultKeywords === "string" && o.defaultKeywords.length) setKeywords(o.defaultKeywords);
          if (typeof o.defaultCity === "string" && o.defaultCity.length) setCity(o.defaultCity);
          if (typeof o.defaultCountryCode === "string" && o.defaultCountryCode.length) setCountryCode(o.defaultCountryCode);
          if (typeof o.defaultUseOverpass === "boolean") {
            // respect stored preference but fall back to Google only if available
            if (o.defaultUseOverpass) setSearchProvider("overpass");
            else setSearchProvider(googleAvailable ? "google" : "overpass");
          }
          // if a Google key is stored, adopt it into state
          if (typeof o.googlePlacesApiKey === 'string' && o.googlePlacesApiKey.length) setGoogleKey(o.googlePlacesApiKey);
          // Respect a stored auto-filter flag if present
          if (typeof o.defaultAutoFilter === "boolean") setAutoFilter(o.defaultAutoFilter);
          if (typeof o.apiBase === "string" && o.apiBase.length) setApiBase(o.apiBase);
        }

        // older versions might store defaults under `defaults` — be tolerant
        const d = parsed?.defaults;
        if (d) {
          if (typeof d.country === "string" && d.country.length) setCountryCode((prev) => prev || d.country);
          if (typeof d.industries === "string" && d.industries.length) setKeywords((prev) => prev || d.industries);
        }
      }
    } catch {
      // ignore and keep env defaults
      console.debug("No user overrides loaded");
    }
  }, [googleAvailable, STORAGE_KEY]);

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

    const payloadBody = { keywords, city, country_code: countryCode, use_overpass: (searchProvider === "overpass"), autoFilter: autoFilter, templateLang };

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
    <>
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
          {/* Radio group: choose Google Places or OSM Overpass */}
          <div className="inline-flex items-center gap-4">
            <label className={`inline-flex items-center gap-2 text-sm dark:text-gray-200 ${!googleAvailable ? 'opacity-50 cursor-not-allowed' : 'text-gray-700'}`} title={!googleAvailable ? 'Google Places API key not set (set it in Settings)' : 'Use Google Places API'}>
              <input
                type="radio"
                name="searchProvider"
                value="google"
                checked={searchProvider === 'google'}
                onChange={() => {
                  setSearchProvider('google');
                  saveOverrides({ defaultUseOverpass: false });
                }}
                disabled={!googleAvailable}
                className="accent-blue-600"
              />
              Google Places
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="searchProvider"
                value="overpass"
                checked={searchProvider === 'overpass'}
                onChange={() => {
                  setSearchProvider('overpass');
                  saveOverrides({ defaultUseOverpass: true });
                }}
                className="accent-blue-600"
              />
              Use OSM Overpass
            </label>
            <button type="button" onClick={() => { setTempKey(googleKey); setShowKeyModal(true); }} className="ml-2 text-xs text-blue-600 hover:underline">Manage API key</button>
          </div>
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

      <GoogleKeyModal
         show={showKeyModal}
         initialKey={tempKey}
         onClose={() => setShowKeyModal(false)}
         onSave={(k) => {
           setGoogleKey(k);
           saveOverrides({ googlePlacesApiKey: k });
           setShowKeyModal(false);
           setToast({ message: "API key saved.", type: "success" });
         }}
       />

      {/* Toast container (top-right) */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60]">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
     </>
   );
 }
