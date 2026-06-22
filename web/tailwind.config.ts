import type { Config } from "tailwindcss";

// VARA design tokens — mirrored from ios/VARA/Theme/Theme.swift and
// server/public/index.html so web matches the app and prototype exactly.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Channels are defined in globals.css and swapped per theme (data-theme),
      // so every utility (incl. /opacity modifiers) themes automatically.
      colors: {
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        surface2: "rgb(var(--c-surface2) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        text: "rgb(var(--c-text) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        accentDim: "rgb(var(--c-accent-dim) / <alpha-value>)",
        win: "rgb(var(--c-win) / <alpha-value>)",
        draw: "rgb(var(--c-draw) / <alpha-value>)",
        lose: "rgb(var(--c-lose) / <alpha-value>)",
        gold: "rgb(var(--c-gold) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans Arabic",
          "-apple-system",
          "Segoe UI",
          "Tahoma",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      maxWidth: {
        app: "760px",
        wide: "1040px",
      },
    },
  },
  plugins: [],
};

export default config;
