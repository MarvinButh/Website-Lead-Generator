"use client";
import { useEffect, useState } from "react";
import { readSettings, saveSettings, getGooglePlacesKeyFromSettings, STORAGE_KEY } from "../../lib/settings";

// New, explicit shapes for stored settings
type ApiKeys = {
  googlePlaces?: string; // GOOGLE_API_KEY (Places)
  googleMapsEmbed?: string; // NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY
};

type ClientOverrides = {
  defaultKeywords: string; // KEYWORDS
  defaultCity: string; // CITY
  defaultCountryCode: string; // COUNTRY_CODE
  defaultUsePlaces: boolean; // USE_PLACES
  defaultUseOverpass: boolean; // USE_OVERPASS
  apiBase: string; // NEXT_PUBLIC_API_BASE
  frontendOrigin: string; // FRONTEND_ORIGIN
  templateLang: string; // TEMPLATE_LANG
  language: string; // UI language selection (en,de,es,ru,fr)
};

type OutreachDefaults = {
  yourName: string;
  yourTitle: string;
  yourCompany: string;
  yourEmail: string;
  yourPhone: string;
  yourWebsite: string;
  calendarLink: string;
  projectLink: string;
  shortOutcome: string;
  defaultPrice: string;
  defaultPages: string;
  defaultTimeline: string;
  supportPeriod: string;
};

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    googlePlaces: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "",
    googleMapsEmbed: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY || "",
  });

  const [overrides, setOverrides] = useState<ClientOverrides>({
    defaultKeywords: process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || "",
    defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY || "",
    defaultCountryCode: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "",
    defaultUsePlaces: (process.env.NEXT_PUBLIC_DEFAULT_USE_PLACES || "false").toLowerCase() === "true",
    defaultUseOverpass: (process.env.NEXT_PUBLIC_DEFAULT_USE_OVERPASS || "false").toLowerCase() === "true",
    apiBase: process.env.NEXT_PUBLIC_API_BASE || "",
    frontendOrigin: process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || "",
    templateLang: process.env.NEXT_PUBLIC_TEMPLATE_LANG || "en",
    language: "en",
  });

  const [outreach, setOutreach] = useState<OutreachDefaults>({
    yourName: "",
    yourTitle: "",
    yourCompany: "",
    yourEmail: "",
    yourPhone: "",
    yourWebsite: "",
    calendarLink: "",
    projectLink: "",
    shortOutcome: "",
    defaultPrice: "",
    defaultPages: "",
    defaultTimeline: "",
    supportPeriod: "",
  });

  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Load settings using shared helpers
  useEffect(() => {
    try {
      const s = readSettings();
      const storedPlaces = s.apiKeys?.googlePlaces || getGooglePlacesKeyFromSettings() || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";
      const storedEmbed = ((s.apiKeys?.googleMapsEmbed as string | undefined) ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY) || "";
      setApiKeys({ googlePlaces: storedPlaces, googleMapsEmbed: String(storedEmbed || "") });

      const o = (s.overrides || {}) as Record<string, unknown>;
      setOverrides({
        defaultKeywords: typeof o.defaultKeywords === "string" ? o.defaultKeywords : (process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || ""),
        defaultCity: typeof o.defaultCity === "string" ? o.defaultCity : (process.env.NEXT_PUBLIC_DEFAULT_CITY || ""),
        defaultCountryCode: typeof o.defaultCountryCode === "string" ? o.defaultCountryCode : (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || ""),
        defaultUsePlaces: typeof o.defaultUsePlaces === "boolean" ? Boolean(o.defaultUsePlaces) : ((process.env.NEXT_PUBLIC_DEFAULT_USE_PLACES || "false").toLowerCase() === "true"),
        defaultUseOverpass: typeof o.defaultUseOverpass === "boolean" ? Boolean(o.defaultUseOverpass) : ((process.env.NEXT_PUBLIC_DEFAULT_USE_OVERPASS || "false").toLowerCase() === "true"),
        apiBase: typeof o.apiBase === "string" ? String(o.apiBase) : (process.env.NEXT_PUBLIC_API_BASE || ""),
        frontendOrigin: typeof o.frontendOrigin === "string" ? String(o.frontendOrigin) : (process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || ""),
        templateLang: typeof o.templateLang === "string" ? String(o.templateLang) : (process.env.NEXT_PUBLIC_TEMPLATE_LANG || "en"),
        language: typeof o.language === "string" ? String(o.language) : "en",
      });

      const out = (s.outreach || {}) as Record<string, unknown>;
      setOutreach({
        yourName: String(out.yourName || ""),
        yourTitle: String(out.yourTitle || ""),
        yourCompany: String(out.yourCompany || ""),
        yourEmail: String(out.yourEmail || ""),
        yourPhone: String(out.yourPhone || ""),
        yourWebsite: String(out.yourWebsite || ""),
        calendarLink: String(out.calendarLink || ""),
        projectLink: String(out.projectLink || ""),
        shortOutcome: String(out.shortOutcome || ""),
        defaultPrice: String(out.defaultPrice || ""),
        defaultPages: String(out.defaultPages || ""),
        defaultTimeline: String(out.defaultTimeline || ""),
        supportPeriod: String(out.supportPeriod || ""),
      });

      setSavedAt(s.savedAt || null);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  function save() {
    const when = new Date().toISOString();
    saveSettings({
      apiKeys: apiKeys,
      overrides: overrides as unknown as Record<string, unknown>,
      outreach: outreach as unknown as Record<string, unknown>,
      savedAt: when,
    });
    setSavedAt(when);
  }

  function resetToDefaults() {
    setApiKeys({ googlePlaces: "", googleMapsEmbed: "" });
    setOverrides({
      defaultKeywords: process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || "",
      defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY || "",
      defaultCountryCode: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || "",
      defaultUsePlaces: (process.env.NEXT_PUBLIC_DEFAULT_USE_PLACES || "false").toLowerCase() === "true",
      defaultUseOverpass: (process.env.NEXT_PUBLIC_DEFAULT_USE_OVERPASS || "false").toLowerCase() === "true",
      apiBase: process.env.NEXT_PUBLIC_API_BASE || "",
      frontendOrigin: process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || "",
      templateLang: process.env.NEXT_PUBLIC_TEMPLATE_LANG || "en",
      language: "en",
    });
    setOutreach({
      yourName: "",
      yourTitle: "",
      yourCompany: "",
      yourEmail: "",
      yourPhone: "",
      yourWebsite: "",
      calendarLink: "",
      projectLink: "",
      shortOutcome: "",
      defaultPrice: "",
      defaultPages: "",
      defaultTimeline: "",
      supportPeriod: "",
    });

    // Clear persisted settings so environment defaults are used until saved again
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }

    setSavedAt(null);
  }

  function reloadFromStorage() {
    try {
      const s = readSettings();
      const storedPlaces = s.apiKeys?.googlePlaces || getGooglePlacesKeyFromSettings() || "";
      const storedEmbed = (s.apiKeys?.googleMapsEmbed as string | undefined) || "";
      setApiKeys({ googlePlaces: storedPlaces, googleMapsEmbed: String(storedEmbed) });

      const o = (s.overrides || {}) as Record<string, unknown>;
      setOverrides({
        defaultKeywords: String(o.defaultKeywords || ""),
        defaultCity: String(o.defaultCity || ""),
        defaultCountryCode: String(o.defaultCountryCode || ""),
        defaultUsePlaces: Boolean(o.defaultUsePlaces ?? false),
        defaultUseOverpass: Boolean(o.defaultUseOverpass ?? false),
        apiBase: String(o.apiBase || ""),
        frontendOrigin: String(o.frontendOrigin || ""),
        templateLang: String(o.templateLang || "en"),
        language: String(o.language || "en"),
      });

      const out = (s.outreach || {}) as Record<string, unknown>;
      setOutreach({
        yourName: String(out.yourName || ""),
        yourTitle: String(out.yourTitle || ""),
        yourCompany: String(out.yourCompany || ""),
        yourEmail: String(out.yourEmail || ""),
        yourPhone: String(out.yourPhone || ""),
        yourWebsite: String(out.yourWebsite || ""),
        calendarLink: String(out.calendarLink || ""),
        projectLink: String(out.projectLink || ""),
        shortOutcome: String(out.shortOutcome || ""),
        defaultPrice: String(out.defaultPrice || ""),
        defaultPages: String(out.defaultPages || ""),
        defaultTimeline: String(out.defaultTimeline || ""),
        supportPeriod: String(out.supportPeriod || ""),
      });

      setSavedAt(s.savedAt || null);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
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

      <p className="mt-2 text-gray-600 dark:text-gray-300">Configure API keys and client-side defaults. These values are stored locally in your browser.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* API Keys card */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow p-6">
          <h2 className="text-xl font-semibold">API Keys</h2>
          <p className="text-sm text-gray-500 mt-1">Keys used by the frontend for Places and Maps embeds. Stored locally in your browser.</p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Google Places API Key</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={apiKeys.googlePlaces || ""}
                onChange={(e) => setApiKeys((k) => ({ ...k, googlePlaces: e.target.value }))}
                placeholder="GOOGLE_API_KEY"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Google Maps Embed API Key</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={apiKeys.googleMapsEmbed || ""}
                onChange={(e) => setApiKeys((k) => ({ ...k, googleMapsEmbed: e.target.value }))}
                placeholder="NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY"
              />
            </div>
          </div>
        </section>

        {/* Client overrides card */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow p-6">
          <h2 className="text-xl font-semibold">Client overrides</h2>
          <p className="text-sm text-gray-500 mt-1">Per-user defaults for the app (stored locally).</p>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm">Default keywords</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={overrides.defaultKeywords}
                onChange={(e) => setOverrides((o) => ({ ...o, defaultKeywords: e.target.value }))}
                placeholder="e.g. Bäckerei, Friseur"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Default city</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={overrides.defaultCity}
                  onChange={(e) => setOverrides((o) => ({ ...o, defaultCity: e.target.value }))}
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm">Default country code</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={overrides.defaultCountryCode}
                  onChange={(e) => setOverrides((o) => ({ ...o, defaultCountryCode: e.target.value }))}
                  placeholder="DE"
                />
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={overrides.defaultUsePlaces}
                  onChange={(e) => setOverrides((o) => ({ ...o, defaultUsePlaces: e.target.checked }))}
                  className="rounded border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <span className="text-sm">Use Places by default</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={overrides.defaultUseOverpass}
                  onChange={(e) => setOverrides((o) => ({ ...o, defaultUseOverpass: e.target.checked }))}
                  className="rounded border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <span className="text-sm">Use Overpass by default</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">API base (optional)</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={overrides.apiBase}
                  onChange={(e) => setOverrides((o) => ({ ...o, apiBase: e.target.value }))}
                  placeholder="http://localhost:8000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Frontend origin</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={overrides.frontendOrigin}
                  onChange={(e) => setOverrides((o) => ({ ...o, frontendOrigin: e.target.value }))}
                  placeholder="http://localhost:3000"
                />
              </div>

              <div>
                <label className="block text-sm">Template language</label>
                <select
                  className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={overrides.templateLang}
                  onChange={(e) => setOverrides((o) => ({ ...o, templateLang: e.target.value }))}
                >
                  <option value="en">English</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                  <option value="ru">Russian</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm">UI language</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={overrides.language}
                onChange={(e) => setOverrides((o) => ({ ...o, language: e.target.value }))}
              >
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="es">Spanish</option>
                <option value="ru">Russian</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        </section>

        {/* Outreach defaults card */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow p-6">
          <h2 className="text-xl font-semibold">Outreach defaults</h2>
          <p className="text-sm text-gray-500 mt-1">Defaults used when generating cold emails/phone scripts and offers.</p>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Your name</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.yourName} onChange={(e) => setOutreach((o) => ({ ...o, yourName: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm">Your title</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.yourTitle} onChange={(e) => setOutreach((o) => ({ ...o, yourTitle: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Company</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.yourCompany} onChange={(e) => setOutreach((o) => ({ ...o, yourCompany: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm">Email</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.yourEmail} onChange={(e) => setOutreach((o) => ({ ...o, yourEmail: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Phone</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.yourPhone} onChange={(e) => setOutreach((o) => ({ ...o, yourPhone: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm">Website</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.yourWebsite} onChange={(e) => setOutreach((o) => ({ ...o, yourWebsite: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Calendar link</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.calendarLink} onChange={(e) => setOutreach((o) => ({ ...o, calendarLink: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm">Project link</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.projectLink} onChange={(e) => setOutreach((o) => ({ ...o, projectLink: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm">Short outcome</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.shortOutcome} onChange={(e) => setOutreach((o) => ({ ...o, shortOutcome: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm">Default price</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.defaultPrice} onChange={(e) => setOutreach((o) => ({ ...o, defaultPrice: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm">Default pages</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.defaultPages} onChange={(e) => setOutreach((o) => ({ ...o, defaultPages: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Default timeline</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.defaultTimeline} onChange={(e) => setOutreach((o) => ({ ...o, defaultTimeline: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm">Support period</label>
                <input className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={outreach.supportPeriod} onChange={(e) => setOutreach((o) => ({ ...o, supportPeriod: e.target.value }))} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="rounded-2xl bg-green-600 px-4 py-2 text-white hover:bg-green-700" onClick={save} type="button">Save settings</button>

        <button className="rounded-2xl border px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={reloadFromStorage} type="button">Reload</button>

        <button className="rounded-2xl border px-4 py-2 text-red-600 hover:bg-red-50" onClick={resetToDefaults} type="button">Reset to defaults</button>
      </div>

      <section className="mt-6 text-sm text-gray-600 dark:text-gray-300">
        <h3 className="font-semibold">Notes</h3>
        <ul className="list-disc ml-5 mt-2">
          <li>These settings are stored locally in your browser (localStorage) and are not sent to any server by this UI.</li>
          <li>Some environment values are build-time only and may not be visible here; these fields let you store per-user overrides for the frontend.</li>
        </ul>
      </section>
    </div>
  );
}
