"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Money } from "@/components/money";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import type { Currency } from "@/lib/money";
import { CHART_ACCENT, CHART_PALETTE } from "@/lib/chart-colors";
import { monthName } from "@/lib/periods";
import type { PlanMatrix } from "@/lib/queries/plan";
import {
  AddCategoryForm,
  PlanCellInput,
  CategoryRowActions,
} from "@/app/(app)/plan/plan-forms";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type ChartMode = "trend" | "allocation";
type PlanMode = "grid" | "monthly";

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ key: T; label: string }>;
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex shrink-0 rounded-[10px] bg-surface-muted p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.key)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              selected
                ? "bg-surface-card text-ink shadow-sm"
                : "bg-transparent text-ink-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function MobilePlan({
  year,
  currency,
  matrix,
  planBars,
  allocations,
  allocationCenterLabel,
}: {
  year: number;
  currency: Currency;
  matrix: PlanMatrix;
  planBars: Array<{ label: string; planned: number | null; actual: number | null }>;
  allocations: Array<{ key: string; name: string; value: number; color: string }>;
  allocationCenterLabel: string;
}) {
  const now = useMemo(() => new Date(), []);
  const defaultMonthIndex =
    year === now.getFullYear() ? now.getMonth() : 0;

  const [chartMode, setChartMode] = useState<ChartMode>("trend");
  const [planMode, setPlanMode] = useState<PlanMode>("grid");
  const [monthIndex, setMonthIndex] = useState(defaultMonthIndex);

  useEffect(() => {
    setMonthIndex(year === now.getFullYear() ? now.getMonth() : 0);
  }, [year, now]);

  const circleBtn =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-card text-ink transition hover:border-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:ring-offset-neutral-950";

  function shiftMonth(delta: number) {
    setMonthIndex((prev) => Math.min(11, Math.max(0, prev + delta)));
  }

  const monthTotal = matrix.columnTotals[monthIndex];

  return (
    <div className="space-y-[18px] md:hidden">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.01em] text-ink">Category plan</h1>
        <div className="mt-4 flex items-center gap-2">
          <Link href={`/plan?year=${year - 1}`} aria-label="Previous year" className={circleBtn}>
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </Link>
          <span className="min-w-0 flex-1 text-center text-[15px] font-semibold text-ink">
            {year}
          </span>
          <Link href={`/plan?year=${year + 1}`} aria-label="Next year" className={circleBtn}>
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </header>

      <section className="card !rounded-[20px]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="section-title">Planned vs actual</h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              Monthly {year} totals in {currency}
            </p>
          </div>
          <SegmentedControl
            ariaLabel="Chart view"
            value={chartMode}
            onChange={setChartMode}
            options={[
              { key: "trend", label: "Trend" },
              { key: "allocation", label: "Allocation" },
            ]}
          />
        </div>

        {chartMode === "trend" ? (
          <BarChart
            title="Planned versus actual"
            data={planBars}
            series={[
              { key: "planned", name: "Planned", color: CHART_ACCENT },
              { key: "actual", name: "Actual", color: "#3d9b6a" },
            ]}
            currency={currency}
            emptyMessage="No plan or expense data for this year."
            embedded
            compact
          />
        ) : (
          <DonutChart
            title="Planned allocation"
            segments={allocations}
            currency={currency}
            centerLabel={allocationCenterLabel}
            centerSubLabel="Total plan"
            emptyMessage="No planned allocations for this year."
            embedded
          />
        )}
      </section>

      <section className="card !rounded-[20px]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="section-title">Monthly plan</h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              Plan amounts in CRC; small figure is actual spend.
            </p>
          </div>
          <SegmentedControl
            ariaLabel="Plan matrix view"
            value={planMode}
            onChange={setPlanMode}
            options={[
              { key: "grid", label: "Grid" },
              { key: "monthly", label: "Monthly" },
            ]}
          />
        </div>

        <div className="mb-4 border-b border-line pb-4">
          <AddCategoryForm />
        </div>

        {planMode === "grid" ? (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="border-b border-line bg-brand-50 text-left dark:bg-brand-950/40">
                  <th
                    scope="col"
                    className="sticky left-0 z-[1] bg-brand-50 px-3 py-2 font-semibold text-ink dark:bg-brand-950"
                  >
                    Category
                  </th>
                  {MONTH_ABBR.map((m) => (
                    <th key={m} scope="col" className="px-2 py-2 text-right font-semibold text-ink">
                      {m}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-right font-semibold text-ink">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => (
                  <tr key={row.categoryId} className="border-b border-line align-top">
                    <th
                      scope="row"
                      className={`sticky left-0 z-[1] bg-surface-card px-3 py-2 text-left font-medium ${
                        row.archived ? "text-ink-faint line-through" : "text-ink"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <span>{row.categoryName}</span>
                        <CategoryRowActions
                          categoryId={row.categoryId}
                          categoryName={row.categoryName}
                          archived={row.archived}
                        />
                      </div>
                    </th>
                    {row.planned.map((planned, idx) => (
                      <td key={idx} className="px-2 py-2 text-right">
                        {row.archived ? (
                          <span className="tabular-nums text-ink-faint">
                            <Money minor={planned} currency={currency} />
                          </span>
                        ) : (
                          <PlanCellInput
                            categoryId={row.categoryId}
                            year={year}
                            month={idx + 1}
                            valueMinor={row.plannedRaw[idx]}
                          />
                        )}
                        <p className="mt-0.5 text-[10px] tabular-nums text-ink-faint">
                          <Money minor={row.actual[idx]} currency={currency} />
                        </p>
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">
                      <Money minor={row.rowTotal} currency={currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface-muted font-semibold">
                  <th
                    scope="row"
                    className="sticky left-0 z-[1] bg-surface-muted px-3 py-2 text-left text-ink"
                  >
                    Month total
                  </th>
                  {matrix.columnTotals.map((total, idx) => (
                    <td key={idx} className="px-2 py-2 text-right tabular-nums text-ink">
                      <Money minor={total} currency={currency} />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums text-ink">
                    <Money minor={matrix.grandTotal} currency={currency} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous month"
                disabled={monthIndex === 0}
                onClick={() => shiftMonth(-1)}
                className={`${circleBtn} disabled:opacity-40`}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </button>
              <span className="min-w-0 flex-1 text-center text-[15px] font-semibold text-ink">
                {monthName(monthIndex + 1)} {year}
              </span>
              <button
                type="button"
                aria-label="Next month"
                disabled={monthIndex === 11}
                onClick={() => shiftMonth(1)}
                className={`${circleBtn} disabled:opacity-40`}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            {matrix.rows.length === 0 ? (
              <p className="rounded-xl bg-surface-muted px-3 py-4 text-sm text-ink-faint">
                No categories yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {matrix.rows.map((row, rowIndex) => {
                  const color = CHART_PALETTE[rowIndex % CHART_PALETTE.length];
                  return (
                    <li
                      key={row.categoryId}
                      className="flex items-center gap-2.5 py-3"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            row.archived ? "text-ink-faint line-through" : "text-ink"
                          }`}
                        >
                          {row.categoryName}
                        </p>
                        <div className="mt-1">
                          <CategoryRowActions
                            categoryId={row.categoryId}
                            categoryName={row.categoryName}
                            archived={row.archived}
                          />
                        </div>
                      </div>
                      {row.archived ? (
                        <span className="text-sm tabular-nums text-ink-faint">
                          <Money
                            minor={row.planned[monthIndex]}
                            currency={currency}
                          />
                        </span>
                      ) : (
                        <PlanCellInput
                          categoryId={row.categoryId}
                          year={year}
                          month={monthIndex + 1}
                          valueMinor={row.plannedRaw[monthIndex]}
                          inputClassName="w-24 px-2 py-1.5"
                        />
                      )}
                      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-ink-muted">
                        <Money minor={row.actual[monthIndex]} currency={currency} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm font-bold text-ink">Month total</span>
              <span className="text-sm font-bold tabular-nums text-ink">
                <Money minor={monthTotal} currency={currency} />
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
