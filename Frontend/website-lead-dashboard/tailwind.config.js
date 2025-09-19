import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "navy-900": "var(--navy-900)",
        "navy-800": "var(--navy-800)",
        brand: "var(--brand)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#6366f1", // indigo-500, matches --brand
          secondary: "#8b5cf6", // violet-500
          accent: "#06b6d4", // cyan-500
          neutral: "#1f2937", // gray-800
          "base-100": "#f7fafc", // matches --background light
          "base-200": "#edf2f7", // slightly darker
          "base-300": "#e2e8f0", // even darker
          info: "#3b82f6", // blue-500
          success: "#10b981", // emerald-500
          warning: "#f59e0b", // amber-500
          error: "#ef4444", // red-500
        },
        dark: {
          primary: "#6366f1", // indigo-500, matches --brand
          secondary: "#8b5cf6", // violet-500
          accent: "#06b6d4", // cyan-500
          neutral: "#e6eef8", // matches --foreground dark
          "base-100": "#071226", // matches --background dark
          "base-200": "#0b1226", // matches --navy-800
          "base-300": "#1e293b", // slightly lighter
          info: "#3b82f6", // blue-500
          success: "#10b981", // emerald-500
          warning: "#f59e0b", // amber-500
          error: "#ef4444", // red-500
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};

export default config;