"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMinor, type Currency } from "@/lib/money";

export interface DonutSegment {
  key: string;
  name: string;
  value: number;
  color: string;
}

export function DonutChart({
  title,
  subtitle,
  segments,
  currency,
  centerLabel,
  centerSubLabel,
  emptyMessage = "No data for this period.",
}: {
  title: string;
  subtitle?: string;
  segments: DonutSegment[];
  currency: Currency;
  centerLabel: string;
  centerSubLabel?: string;
  emptyMessage?: string;
}) {
  const active = segments.filter((s) => s.value > 0);
  const total = active.reduce((acc, s) => acc + s.value, 0);
  const empty = total <= 0 || active.length === 0;

  return (
    <section className="card h-full min-h-[280px]" aria-label={title}>
      <h2 className="section-title mb-1">{title}</h2>
      {subtitle && <p className="mb-4 text-xs text-ink-muted">{subtitle}</p>}
      {empty ? (
        <div className="flex h-48 items-center justify-center rounded-lg surface-muted text-sm text-ink-faint">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={active}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {active.map((s) => (
                    <Cell key={s.key} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--chart-surface)", borderColor: "var(--chart-border)", color: "var(--chart-text)" }}
                  formatter={(value) =>
                    typeof value === "number" ? formatMinor(value, currency) : "—"
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
              {centerSubLabel && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                    {centerSubLabel}
                  </span>
                )}
              <span className="text-sm font-bold tabular-nums text-ink">{centerLabel}</span>
            </div>
          </div>
          <ul className="w-full space-y-2 text-sm">
            {active.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-ink-secondary">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  />
                  {s.name}
                </span>
                <span className="tabular-nums text-ink-muted">
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
