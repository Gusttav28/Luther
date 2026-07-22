import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark green — primary brand
        brand: {
          50: "#f0f7f3",
          100: "#dceee4",
          200: "#b8dcc8",
          300: "#86c1a3",
          400: "#549f79",
          500: "#35815c",
          600: "#266749",
          700: "#1f523b",
          800: "#1a4231",
          900: "#143628",
          950: "#0b1f17",
        },
        surface: {
          DEFAULT: "var(--luther-page)",
          card: "var(--luther-card)",
          elevated: "var(--luther-elevated)",
          muted: "var(--luther-muted-surface)",
        },
        ink: {
          DEFAULT: "var(--luther-text)",
          secondary: "var(--luther-text-secondary)",
          muted: "var(--luther-text-muted)",
          faint: "var(--luther-text-faint)",
        },
        line: {
          DEFAULT: "var(--luther-border)",
          strong: "var(--luther-border-strong)",
        },
        positive: {
          DEFAULT: "#3d9b6a",
          soft: "#e8f5ee",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(11, 31, 23, 0.05), 0 4px 16px rgba(11, 31, 23, 0.04)",
      },
      borderRadius: {
        card: "12px",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
