"use client";

import { Bar, BarChart as RechartsBarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMinor, type Currency } from "@/lib/money";

export interface BarSeries {
  key: string;
  name: string;
  color: string;
}

export function BarChart({
  title,
  subtitle,
  data,
  series,
  currency,
  emptyMessage = "No data available for this chart.",
}: {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number | null>>;
  series: BarSeries[];
  currency: Currency;
  emptyMessage?: string;
}) {
  const hasData = data.some((row) => series.some((item) => typeof row[item.key] === "number"));
  return (
    <section className="card min-w-0" aria-label={title}>
      <h2 className="section-title mb-1">{title}</h2>
      {subtitle && <p className="mb-4 text-xs text-ink-muted">{subtitle}</p>}
      {!hasData ? (
        <div className="flex h-56 items-center justify-center rounded-lg surface-muted text-sm text-ink-faint">
          {emptyMessage}
        </div>
      ) : (
        <div className="h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--chart-text)", fontSize: 11 }} tickFormatter={(value) => formatMinor(value, currency)} width={72} />
              <Tooltip
                contentStyle={{ background: "var(--chart-surface)", borderColor: "var(--chart-border)", color: "var(--chart-text)" }}
                labelStyle={{ color: "var(--chart-text)" }}
                itemStyle={{ color: "var(--chart-text)" }}
                formatter={(value) => (typeof value === "number" ? formatMinor(value, currency) : "Unavailable")}
              />
              <Legend wrapperStyle={{ color: "var(--chart-text)", fontSize: 12 }} />
              {series.map((item) => (
                <Bar key={item.key} dataKey={item.key} name={item.name} fill={item.color} radius={[3, 3, 0, 0]} />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
