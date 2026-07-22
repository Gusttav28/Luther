"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ProjectProgressChart({
  projects,
}: {
  projects: Array<{ name: string; fundedPercent: number | null }>;
}) {
  const data = projects
    .filter((project) => project.fundedPercent !== null)
    .map((project) => ({ label: project.name, funded: project.fundedPercent }));
  return (
    <section className="card min-w-0" aria-label="Project funding progress">
      <h2 className="section-title mb-1">Funding progress</h2>
      <p className="mb-4 text-xs text-ink-muted">Saved percentage by project; currencies are not combined.</p>
      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center rounded-lg surface-muted text-sm text-ink-faint">
          Funding progress is unavailable until project values can be compared.
        </div>
      ) : (
        <div className="h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--chart-text)", fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="label" width={86} tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "var(--chart-surface)", borderColor: "var(--chart-border)", color: "var(--chart-text)" }}
                labelStyle={{ color: "var(--chart-text)" }}
                itemStyle={{ color: "var(--chart-text)" }}
                formatter={(value) => (typeof value === "number" ? `${value}%` : "Unavailable")}
              />
              <Bar dataKey="funded" name="Funded" fill="var(--chart-accent)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
