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
  },
};

export default nextConfig;
