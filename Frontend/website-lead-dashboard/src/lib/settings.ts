"use client";

// Shared helpers for reading/writing UI settings from localStorage
export const STORAGE_KEY = "lead_settings_v2";

export type Overrides = Partial<{
  defaultKeywords: string;
  defaultCity: string;
  defaultCountryCode: string;
  defaultUseOverpass: boolean;
  defaultAutoFilter: boolean;
  apiBase: string;
  googlePlacesApiKey: string;
  templateLang: string;
  // also support legacy/alias keys that might exist
  google_api_key: string;
  googleApiKey: string;
}> & Record<string, unknown>;

export type ApiKeysBlock = {
  googlePlaces?: string;
  googleMapsEmbed?: string;
  [key: string]: unknown;
};

export type RawSettings = {
  overrides?: Overrides;
  // allow top-level fields for legacy data
  googlePlacesApiKey?: string;
  google_api_key?: string;
  googleApiKey?: string;
  apiKeys?: ApiKeysBlock;
  outreach?: Record<string, unknown>;
  savedAt?: string;
  [key: string]: unknown;
};

export function readRawSettings(): RawSettings {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("lead_settings_v1");
    if (!raw) return {};
    return JSON.parse(raw || "{}") as RawSettings;
  } catch {
    return {};
  }
}

export function readOverrides(): Overrides {
  const parsed = readRawSettings();
  const overrides = (parsed?.overrides as Overrides) || (parsed as Overrides) || {};
  return overrides || {};
}

export function setOverrides(upserts: Record<string, unknown>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("lead_settings_v1") || "{}";
    const parsed = JSON.parse(raw || "{}") as RawSettings;
    parsed.overrides = { ...(parsed.overrides || {}), ...upserts };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function getGooglePlacesKeyFromSettings(): string {
  try {
    const parsed = readRawSettings();
    const overrides = readOverrides();
    const candidates: Array<string | undefined> = [
      overrides.googlePlacesApiKey as string | undefined,
      overrides.google_api_key as string | undefined,
      overrides.googleApiKey as string | undefined,
      parsed.googlePlacesApiKey as string | undefined,
      parsed.google_api_key as string | undefined,
      parsed.googleApiKey as string | undefined,
      parsed.apiKeys?.googlePlaces as string | undefined,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.length) return c;
    }
    return "";
  } catch {
    return "";
  }
}

export function readSettings(): RawSettings {
  return readRawSettings();
}

export function saveSettings(data: Partial<RawSettings>) {
  try {
    const current = readRawSettings();
    const next: RawSettings = {
      ...current,
      ...data,
      overrides: { ...(current.overrides || {}), ...(data.overrides || {}) },
      apiKeys: { ...(current.apiKeys || {}), ...(data.apiKeys || {}) },
      outreach: { ...(current.outreach || {}), ...(data.outreach || {}) },
      savedAt: data.savedAt || new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
