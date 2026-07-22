"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMinor, type Currency } from "@/lib/money";
import type { CashflowPoint } from "@/lib/queries/overview-dashboard";

function hasSeries(points: CashflowPoint[]): boolean {
  return points.some(
    (p) =>
      (p.cumulativeNet !== null && p.cumulativeNet !== 0) ||
      (p.cumulativeSpent !== null && p.cumulativeSpent !== 0) ||
      (p.cumulativeEarned !== null && p.cumulativeEarned !== 0)
  );
}

export function CashflowChart({
  points,
  currency,
}: {
  points: CashflowPoint[];
  currency: Currency;
}) {
  const empty = !hasSeries(points);

  return (
    <section className="card h-full min-h-[280px]">
      <h2 className="section-title mb-1">Cashflow</h2>
      <p className="mb-4 text-xs text-ink-muted">Cumulative earned vs spent this month</p>
      {empty ? (
        <div className="flex h-48 items-center justify-center rounded-lg surface-muted text-sm text-ink-faint">
          No cashflow data for this month yet.
        </div>
      ) : (
        <div className="h-56 w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--chart-text)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--chart-text)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => {
                  const abs = Math.abs(v);
                  const whole = Math.round(abs / 100);
                  if (whole >= 1000) return `${(whole / 1000).toFixed(1)}k`;
                  return String(whole);
                }}
              />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number" ? formatMinor(value, currency) : "—"
                }
                contentStyle={{
                  borderRadius: 12,
                  background: "var(--chart-surface)",
                  border: "1px solid var(--chart-border)",
                  color: "var(--chart-text)",
                  boxShadow: "0 4px 16px rgb(0 0 0 / 0.18)",
                }}
                labelStyle={{ color: "var(--chart-text)" }}
                itemStyle={{ color: "var(--chart-text)" }}
              />
              <Legend wrapperStyle={{ color: "var(--chart-text)", fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="cumulativeNet"
                name="Net"
                stroke="var(--chart-accent)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--chart-accent)" }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="cumulativeSpent"
                name="Spent"
                stroke="#737373"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#737373" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
