import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  env: {
    NEXT_PUBLIC_DEFAULT_KEYWORDS: process.env.KEYWORDS,
    NEXT_PUBLIC_DEFAULT_CITY: process.env.CITY,
    NEXT_PUBLIC_DEFAULT_COUNTRY_CODE: process.env.COUNTRY_CODE,
    NEXT_PUBLIC_DEFAULT_USE_PLACES: process.env.USE_PLACES,
    NEXT_PUBLIC_DEFAULT_USE_OVERPASS: process.env.USE_OVERPASS,
    // Prefer proxying API calls through Next.js on Vercel (and locally)
    // so the frontend can call same-origin /api/backend/* without CORS.
    // If you want to bypass the proxy, set NEXT_PUBLIC_API_BASE explicitly in env.
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || "/api/backend",
  },
};

export default nextConfig;
