/** Theme-aware chart colors via CSS variables (green in light, white accents in dark). */
export const CHART_ACCENT = "var(--chart-accent)";
export const CHART_ACCENT_2 = "var(--chart-accent-2)";
export const CHART_ACCENT_3 = "var(--chart-accent-3)";

export const CHART_PALETTE = [
  "var(--chart-accent)",
  "var(--chart-accent-2)",
  "var(--chart-accent-3)",
  "#3d9b6a",
  "#549f79",
  "#86c1a3",
] as const;
