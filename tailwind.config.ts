import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f2",
          100: "#d7ecdf",
          200: "#b1d9c2",
          300: "#83bf9f",
          400: "#55a17b",
          500: "#398662",
          600: "#2a6b4e",
          700: "#235640",
          800: "#1e4535",
          900: "#1a392d",
          950: "#0d2019",
        },
      },
    },
  },
  plugins: [],
};

export default config;
