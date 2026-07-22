"use client";

import { DonutChart } from "@/components/charts/donut-chart";
import { formatMinor, type Currency } from "@/lib/money";
import { CHART_ACCENT } from "@/lib/chart-colors";

const COLORS = {
  earned: "#3d9b6a",
  spent: "#737373",
  saved: CHART_ACCENT,
} as const;

export function CompositionDonut({
  earned,
  spent,
  saved,
  currency,
}: {
  earned: number | null;
  spent: number | null;
  saved: number | null;
  currency: Currency;
}) {
  const segments = [
    { key: "earned", name: "Earned", value: earned !== null ? Math.abs(earned) : 0, color: COLORS.earned },
    { key: "spent", name: "Spent", value: spent !== null ? Math.abs(spent) : 0, color: COLORS.spent },
    { key: "saved", name: "Saved", value: saved !== null ? Math.abs(saved) : 0, color: COLORS.saved },
  ].filter((s) => s.value > 0);

  const centerLabel =
    saved !== null && saved > 0
      ? formatMinor(saved, currency)
      : earned !== null
        ? formatMinor(earned, currency)
        : "—";

  const centerSubLabel = saved !== null && saved > 0 ? "Saved" : "Earned";

  return (
    <DonutChart
      title="Composition"
      subtitle="Earned, spent, and saved this month"
      segments={segments}
      currency={currency}
      centerLabel={centerLabel}
      centerSubLabel={centerSubLabel}
      emptyMessage="No composition data for this month."
    />
  );
}
