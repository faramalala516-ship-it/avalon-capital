import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#05070c",
        midnight: "#07111f",
        cobalt: "#1f6feb",
        bullion: "#d8aa46",
        platinum: "#d7dee8",
        graphite: "#101826",
        emerald: "#29c48f"
      },
      boxShadow: {
        glow: "0 0 40px rgba(216,170,70,.15)",
        terminal: "inset 0 1px 0 rgba(255,255,255,.08), 0 24px 80px rgba(0,0,0,.35)"
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Cascadia Code", "Consolas", "monospace"]
      }
    }
  },
  plugins: [forms, typography]
};

export default config;
