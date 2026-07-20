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
      <p className="mb-4 text-xs text-stone-500">Cumulative earned vs spent this month</p>
      {empty ? (
        <div className="flex h-48 items-center justify-center rounded-lg bg-stone-50 text-sm text-stone-400">
          No cashflow data for this month yet.
        </div>
      ) : (
        <div className="h-56 w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#78716c", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#78716c", fontSize: 10 }}
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
                  border: "1px solid #e7e5e4",
                  boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulativeNet"
                name="Net"
                stroke="#d95a45"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#d95a45" }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="cumulativeSpent"
                name="Spent"
                stroke="#a8a29e"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#a8a29e" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
