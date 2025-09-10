"use client";

import { useState, useMemo } from "react";

export default function LeadSearchForm() {
  const defaultKeywords = useMemo(() => process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || "", []);
  const defaultCity = useMemo(() => process.env.NEXT_PUBLIC_DEFAULT_CITY || "", []);
  const defaultCountry = useMemo(() => process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "", []);
  const defaultUseOverpass = useMemo(() => (process.env.NEXT_PUBLIC_DEFAULT_USE_OVERPASS || "false").toLowerCase() === "true", []);
  const defaultAutoFilter = useMemo(() => (process.env.NEXT_PUBLIC_DEFAULT_AUTO_FILTER || "false").toLowerCase() === "true", []);

  const [keywords, setKeywords] = useState<string>(defaultKeywords);
  const [city, setCity] = useState<string>(defaultCity);
  const [countryCode, setCountryCode] = useState<string>(defaultCountry);
  const [useOverpass, setUseOverpass] = useState<boolean>(defaultUseOverpass);
  const [autoFilter, setAutoFilter] = useState<boolean>(defaultAutoFilter);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { inserted: number; found: number; filtered?: number; offers_generated?: number }>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiBase}/leads/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, city, country_code: countryCode, use_overpass: useOverpass, auto_filter: autoFilter }),
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
