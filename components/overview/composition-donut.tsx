"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMinor, type Currency } from "@/lib/money";

const COLORS = {
  earned: "#3d9b6a",
  spent: "#d95a45",
  saved: "#e97a66",
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
    { key: "earned" as const, name: "Earned", value: earned !== null ? Math.abs(earned) : null },
    { key: "spent" as const, name: "Spent", value: spent !== null ? Math.abs(spent) : null },
    { key: "saved" as const, name: "Saved", value: saved !== null ? Math.abs(saved) : null },
  ].filter((s) => s.value !== null && s.value > 0) as Array<{
    key: keyof typeof COLORS;
    name: string;
    value: number;
  }>;

  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const empty = total <= 0 || segments.length === 0;
  const centerLabel =
    earned !== null ? formatMinor(earned, currency) : "—";

  return (
    <section className="card h-full min-h-[280px]">
      <h2 className="section-title mb-1">Composition</h2>
      <p className="mb-4 text-xs text-stone-500">Earned / Spent / Saved this month</p>
      {empty ? (
        <div className="flex h-48 items-center justify-center rounded-lg bg-stone-50 text-sm text-stone-400">
          No composition data for this month.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {segments.map((s) => (
                    <Cell key={s.key} fill={COLORS[s.key]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number" ? formatMinor(value, currency) : "—"
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
                Earned
              </span>
              <span className="text-sm font-bold tabular-nums text-stone-900">{centerLabel}</span>
            </div>
          </div>
          <ul className="w-full space-y-2 text-sm">
            {segments.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-stone-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[s.key] }}
                    aria-hidden
                  />
                  {s.name}
                </span>
                <span className="tabular-nums text-stone-500">
                  {((s.value / total) * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
