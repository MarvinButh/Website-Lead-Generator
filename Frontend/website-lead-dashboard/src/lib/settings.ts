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
  // also support legacy/alias keys that might exist
  google_api_key: string;
  googleApiKey: string;
}> & Record<string, unknown>;

export type RawSettings = {
  overrides?: Overrides;
  // allow top-level fields for legacy data
  googlePlacesApiKey?: string;
  google_api_key?: string;
  googleApiKey?: string;
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
      overrides.googlePlacesApiKey,
      overrides.google_api_key,
      overrides.googleApiKey,
      parsed.googlePlacesApiKey,
      parsed.google_api_key,
      parsed.googleApiKey,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.length) return c;
    }
    return "";
  } catch {
    return "";
  }
}
