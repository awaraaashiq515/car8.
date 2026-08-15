/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Navy backgrounds
        navy: {
          deep:   "#050D1A",
          dark:   "#080F1D",
          card:   "#0D1B2E",
          border: "#1A2E45",
          hover:  "#162540",
        },
        // Blue-Cyan gradient system (matching screenshot)
        blue: {
          primary: "#2563EB",
          bright:  "#3B82F6",
          light:   "#60A5FA",
        },
        cyan: {
          glow:  "#06B6D4",
          light: "#22D3EE",
        },
        // Status colors
        green:  { DEFAULT: "#10B981", dark: "#059669" },
        red:    { DEFAULT: "#EF4444", dark: "#DC2626" },
        amber:  { DEFAULT: "#F59E0B", dark: "#D97706" },
        // Text
        white:  "#F0F6FF",
        muted:  "#6B8CAE",
        dimmed: "#3A5A7A",
        // Legacy (keep for backward compat during transition)
        asphalt:        "#14171C",
        "asphalt-light":"#1D2229",
        marigold:       "#F2A93B",
        "marigold-dark":"#D68F22",
        highway:        "#2F9E7A",
        mist:           "#F5F3EE",
        "slate-light":  "#6B7889",
        rust:           "#C1524A",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body:    ["var(--font-body)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono:    ["var(--font-mono)", "SFMono-Regular", "Consolas", "monospace"],
      },
      backgroundImage: {
        "gradient-btn":    "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
        "gradient-btn-hover": "linear-gradient(135deg, #1D4ED8 0%, #0891B2 100%)",
        "gradient-card":   "linear-gradient(145deg, #0D1B2E 0%, #0A1525 100%)",
        "gradient-hero":   "linear-gradient(180deg, #050D1A 0%, #080F1D 100%)",
        "gradient-glow":   "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.18) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(37, 99, 235, 0.35), 0 0 60px rgba(6, 182, 212, 0.12)",
        "glow-cyan": "0 0 15px rgba(6, 182, 212, 0.4)",
        "card":      "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover":"0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(37,99,235,0.25)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(16,185,129,0.6)" },
          "50%":       { boxShadow: "0 0 24px rgba(16,185,129,0.9)" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "dash-draw": {
          "0%":   { strokeDashoffset: "400" },
          "100%": { strokeDashoffset: "0" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "count-down": {
          "0%":   { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "113" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-up":    "fade-up 0.4s ease-out both",
        "slide-in":   "slide-in 0.35s ease-out both",
        "dash-draw":  "dash-draw 2.2s ease-out forwards",
        "spin-slow":  "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [],
};
