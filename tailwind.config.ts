import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        foam: "#faf8f4",
        pearl: "#f4efe6",
        nacre: "#e8dfd0",
        gold: {
          DEFAULT: "#b8956c",
          soft: "#d4bc94",
          deep: "#8a6b45"
        },
        stone: {
          DEFAULT: "#6b635c",
          soft: "#9a9086",
          deep: "#3f3a36"
        },
        aqua: {
          DEFAULT: "#4f8f9c",
          soft: "#9ec9d2",
          deep: "#0d3d45",
          mist: "#c9e4e8"
        },
        ink: "#1a2428"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "sans-serif"]
      },
      boxShadow: {
        pearl: "0 24px 60px rgba(13, 61, 69, 0.12), inset 0 1px 0 rgba(255,255,255,0.55)",
        gold: "0 12px 40px rgba(184, 149, 108, 0.28)"
      },
      backgroundImage: {
        nacre:
          "linear-gradient(135deg, rgba(255,255,255,.55) 0%, rgba(232,223,208,.4) 35%, rgba(158,201,210,.25) 70%, rgba(212,188,148,.35) 100%)",
        aquatic:
          "radial-gradient(ellipse at 20% 10%, rgba(158,201,210,.45), transparent 45%), radial-gradient(ellipse at 85% 20%, rgba(212,188,148,.35), transparent 40%), radial-gradient(ellipse at 50% 90%, rgba(13,61,69,.18), transparent 50%)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        fadeRise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        ripple: {
          "0%": { transform: "scale(1)", opacity: ".5" },
          "100%": { transform: "scale(1.35)", opacity: "0" }
        }
      },
      animation: {
        shimmer: "shimmer 8s ease infinite",
        float: "float 7s ease-in-out infinite",
        fadeRise: "fadeRise .9s ease forwards",
        ripple: "ripple 2.8s ease-out infinite"
      }
    }
  },
  plugins: [forms, typography]
};

export default config;
