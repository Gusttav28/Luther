import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf5f3",
          100: "#fce8e4",
          200: "#f9d0c8",
          300: "#f3a99a",
          400: "#e97a66",
          500: "#d95a45",
          600: "#c44532",
          700: "#a43828",
          800: "#883225",
          900: "#722e23",
          950: "#3d1410",
        },
        surface: {
          DEFAULT: "#F5F6F8",
          card: "#FFFFFF",
        },
        positive: {
          DEFAULT: "#3d9b6a",
          soft: "#e8f5ee",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.04)",
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
