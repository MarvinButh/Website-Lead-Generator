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
          primary: "#3742fa", // Blue from US palette (Bright Blue)
          secondary: "#5352ed", // Purple from US palette (Light Blue)
          accent: "#2ed573", // Green from US palette (Mint Green)
          neutral: "#747d8c", // Gray from US palette (Blue Grey)
          "base-100": "#ffffff", // White
          "base-200": "#f1f2f6", // Light Gray from US palette (Lighter)
          "base-300": "#ddd", // Medium Gray
          info: "#70a1ff", // Light Blue from US palette (Jordy Blue)
          success: "#2ed573", // Mint Green from US palette
          warning: "#ffa502", // Orange from US palette (Bright Orange)
          error: "#ff3838", // Red from US palette (Red Orange)
        },
        dark: {
          primary: "#3742fa", // Blue from US palette (Bright Blue)
          secondary: "#5352ed", // Purple from US palette (Light Blue)
          accent: "#2ed573", // Green from US palette (Mint Green)
          neutral: "#a4b0be", // Light Gray from US palette
          "base-100": "#2f3542", // Dark Blue Gray from US palette
          "base-200": "#40407a", // Dark Blue from US palette
          "base-300": "#57606f", // Gray Blue from US palette
          info: "#70a1ff", // Light Blue from US palette (Jordy Blue)
          success: "#2ed573", // Mint Green from US palette
          warning: "#ffa502", // Orange from US palette (Bright Orange)
          error: "#ff3838", // Red from US palette (Red Orange)
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
    themeRoot: ":root",
    respectPrefersColorScheme: false, // Disable automatic theme detection
  },
};

export default config;