"use client";
import { useEffect, useState } from "react";
import SideBar from "@/components/SideBar";

type ApiKey = {
  id: string;
  name: string; // e.g. "OpenAI"
  value: string;
};

type LeadDefaults = {
  country: string;
  industries: string; // comma separated
  minEmployees: number | "";
  minRevenue: number | "";
  leadLimit: number;
  includeEmails: boolean;
  language: string;
};

type ClientOverrides = {
  defaultKeywords: string;
  defaultCity: string;
  defaultCountryCode: string;
  defaultUsePlaces: boolean;
  defaultUseOverpass: boolean;
  apiBase: string;
};

const STORAGE_KEY = "lead_settings_v1";

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [defaults, setDefaults] = useState<LeadDefaults>({
    country: "US",
    industries: "",
    minEmployees: "",
    minRevenue: "",
    leadLimit: 50,
    includeEmails: true,
    language: "en",
  });

  // Client-side overrides for environment-like values that are safe to change per user.
  const [overrides, setOverrides] = useState<ClientOverrides>({
    defaultKeywords: process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || "",
    defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY || "",
    defaultCountryCode: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "",
    defaultUsePlaces: (process.env.NEXT_PUBLIC_DEFAULT_USE_PLACES || "false").toLowerCase() === "true",
    defaultUseOverpass: (process.env.NEXT_PUBLIC_DEFAULT_USE_OVERPASS || "false").toLowerCase() === "true",
    apiBase: process.env.NEXT_PUBLIC_API_BASE || "",
  });

  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.apiKeys) setApiKeys(parsed.apiKeys);
        if (parsed?.defaults) setDefaults(parsed.defaults);
        if (parsed?.overrides) setOverrides(parsed.overrides);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  function save() {
    const payload = { apiKeys, defaults, overrides };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSavedAt(new Date().toISOString());
  }

  function resetToDefaults() {
    setApiKeys([]);
    setDefaults({
      country: "US",
      industries: "",
      minEmployees: "",
      minRevenue: "",
      leadLimit: 50,
      includeEmails: true,
      language: "en",
    });
    setOverrides({
      defaultKeywords: process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || "",
      defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY || "",
      defaultCountryCode: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "",
      defaultUsePlaces: (process.env.NEXT_PUBLIC_DEFAULT_USE_PLACES || "false").toLowerCase() === "true",
      defaultUseOverpass: (process.env.NEXT_PUBLIC_DEFAULT_USE_OVERPASS || "false").toLowerCase() === "true",
      apiBase: process.env.NEXT_PUBLIC_API_BASE || "",
    });
    localStorage.removeItem(STORAGE_KEY);
    setSavedAt(null);
  }

  function addApiKey() {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;
    const id = String(Date.now());
    setApiKeys((s) => [...s, { id, name: newKeyName.trim(), value: newKeyValue.trim() }]);
    setNewKeyName("");
    setNewKeyValue("");
  }

  function updateApiKey(id: string, field: keyof ApiKey, value: string) {
    setApiKeys((s) => s.map((k) => (k.id === id ? { ...k, [field]: value } : k)));
  }

  function removeApiKey(id: string) {
    setApiKeys((s) => s.filter((k) => k.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto flex max-w-7xl">
        <SideBar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Settings</h1>
            <div className="text-right text-sm text-gray-600 dark:text-gray-300">
              {savedAt ? (
                <div>Saved: {new Date(savedAt).toLocaleString()}</div>
              ) : (
                <div>Not saved yet</div>
              )}
            </div>
          </div>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Configure API keys and default lead-finding preferences.
          </p>

          <section className="mt-6">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Store and manage API keys your integrations need. Keys are saved in your browser (localStorage).</p>

            <div className="mt-4 space-y-3">
              {apiKeys.length === 0 && (
                <div className="text-sm text-gray-500">No API keys configured yet.</div>
              )}

              {apiKeys.map((k) => (
                <div key={k.id} className="flex gap-2 items-center">
                  <input
                    className="flex-1 rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={k.name}
                    onChange={(e) => updateApiKey(k.id, "name", e.target.value)}
                    placeholder="Key name (e.g. OpenAI)"
                  />
                  <input
                    className="flex-1 rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={k.value}
                    onChange={(e) => updateApiKey(k.id, "value", e.target.value)}
                    placeholder="Secret value"
                  />
                  <button
                    className="rounded bg-red-500 px-3 py-2 text-white hover:bg-red-600"
                    onClick={() => removeApiKey(k.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="flex gap-2 items-center">
                <input
                  className="w-1/4 rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Name (e.g. OpenAI)"
                />
                <input
                  className="flex-1 rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Secret value"
                />
                <button
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={addApiKey}
                  type="button"
                >
                  Add Key
                </button>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Client overrides (per-user)</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">These values override build-time environment defaults for your browser session only. They are stored locally and do not change server-side environment variables.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm">Default keywords</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={overrides.defaultKeywords}
                  onChange={(e) => setOverrides((o) => ({ ...o, defaultKeywords: e.target.value }))}
                  placeholder={process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || "e.g. web design,saas"}
                />
              </div>

              <div>
                <label className="block text-sm">Default city</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={overrides.defaultCity}
                  onChange={(e) => setOverrides((o) => ({ ...o, defaultCity: e.target.value }))}
                  placeholder={process.env.NEXT_PUBLIC_DEFAULT_CITY || "City"}
                />
              </div>

              <div>
                <label className="block text-sm">Default country code</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={overrides.defaultCountryCode}
                  onChange={(e) => setOverrides((o) => ({ ...o, defaultCountryCode: e.target.value }))}
                  placeholder={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "US"}
                />
              </div>

              <div>
                <label className="block text-sm">API base (optional)</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={overrides.apiBase}
                  onChange={(e) => setOverrides((o) => ({ ...o, apiBase: e.target.value }))}
                  placeholder={process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}
                />
              </div>

              <div className="sm:col-span-2 flex gap-4 items-center">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overrides.defaultUsePlaces}
                    onChange={(e) => setOverrides((o) => ({ ...o, defaultUsePlaces: e.target.checked }))}
                    className="rounded border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-sm">Use Places by default</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overrides.defaultUseOverpass}
                    onChange={(e) => setOverrides((o) => ({ ...o, defaultUseOverpass: e.target.checked }))}
                    className="rounded border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-sm">Use Overpass by default</span>
                </label>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Default lead-finding preferences</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Set defaults that are applied when searching for leads.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm">Country</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={defaults.country}
                  onChange={(e) => setDefaults((d) => ({ ...d, country: e.target.value }))}
                  placeholder="Country code (e.g. US)"
                />
              </div>

              <div>
                <label className="block text-sm">Language</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={defaults.language}
                  onChange={(e) => setDefaults((d) => ({ ...d, language: e.target.value }))}
                  placeholder="en"
                />
              </div>

              <div>
                <label className="block text-sm">Industries</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={defaults.industries}
                  onChange={(e) => setDefaults((d) => ({ ...d, industries: e.target.value }))}
                  placeholder="Comma separated (e.g. SaaS,Healthcare)"
                />
              </div>

              <div>
                <label className="block text-sm">Lead limit</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={defaults.leadLimit}
                  onChange={(e) => setDefaults((d) => ({ ...d, leadLimit: Number(e.target.value || 0) }))}
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm">Minimum employees</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={defaults.minEmployees as number | ""}
                  onChange={(e) => setDefaults((d) => ({ ...d, minEmployees: e.target.value ? Number(e.target.value) : "" }))}
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm">Minimum revenue (USD)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={defaults.minRevenue as number | ""}
                  onChange={(e) => setDefaults((d) => ({ ...d, minRevenue: e.target.value ? Number(e.target.value) : "" }))}
                  min={0}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={defaults.includeEmails}
                    onChange={(e) => setDefaults((d) => ({ ...d, includeEmails: e.target.checked }))}
                    className="rounded border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-sm">Include emails when available</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                onClick={save}
                type="button"
              >
                Save settings
              </button>

              <button
                className="rounded border px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  // load from storage to refresh view
                  try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (raw) {
                      const parsed = JSON.parse(raw);
                      if (parsed?.apiKeys) setApiKeys(parsed.apiKeys);
                      if (parsed?.defaults) setDefaults(parsed.defaults);
                      if (parsed?.overrides) setOverrides(parsed.overrides);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                type="button"
              >
                Reload
              </button>

              <button
                className="rounded border px-4 py-2 text-red-600 hover:bg-red-50"
                onClick={resetToDefaults}
                type="button"
              >
                Reset to defaults
              </button>
            </div>
          </section>

          <section className="mt-8 text-sm text-gray-600 dark:text-gray-300">
            <h3 className="font-semibold">Notes</h3>
            <ul className="list-disc ml-5 mt-2">
              <li>API keys are stored locally in your browser (localStorage). They are not sent to any server by this UI.</li>
              <li>Defaults are applied when you create a new search or run a pipeline in the app.</li>
              <li>
                Client overrides are per-user settings that change how the app behaves in your browser. They do not affect other users or the server.
              </li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
