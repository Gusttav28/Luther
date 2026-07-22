import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getPlanMatrix } from "@/lib/queries/plan";
import { Money, RatesNote } from "@/components/money";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { formatMinor } from "@/lib/money";
import { CHART_ACCENT, CHART_PALETTE } from "@/lib/chart-colors";
import { AddCategoryForm, PlanCellInput, CategoryRowActions } from "./plan-forms";

export const dynamic = "force-dynamic";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();

  const settings = await getSettings(userId);
  const matrix = await getPlanMatrix(userId, year, settings.reportingCurrency, settings.rates);
  const actualTotals = MONTH_ABBR.map((_, monthIdx) =>
    matrix.rows.reduce<number | null>((total, row) => {
      if (total === null || row.actual[monthIdx] === null) return null;
      return total + row.actual[monthIdx]!;
    }, 0)
  );
  const planBars = MONTH_ABBR.map((label, monthIdx) => ({
    label,
    planned: matrix.columnTotals[monthIdx],
    actual: actualTotals[monthIdx],
  }));
  const allocationUnavailable = matrix.rows.some((row) => row.rowTotal === null);
  const allocations = (allocationUnavailable ? [] : matrix.rows)
    .filter((row) => row.rowTotal !== null && row.rowTotal > 0)
    .map((row, index) => ({
      key: row.categoryId,
      name: row.categoryName,
      value: row.rowTotal!,
      color: CHART_PALETTE[index % CHART_PALETTE.length],
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Category plan</h1>
        <div className="flex items-center gap-2">
          <Link href={`/plan?year=${year - 1}`} aria-label="Previous year" className="btn-secondary px-2.5">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </Link>
          <span className="min-w-16 text-center text-sm font-semibold text-ink">{year}</span>
          <Link href={`/plan?year=${year + 1}`} aria-label="Next year" className="btn-secondary px-2.5">
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart
          title="Planned versus actual"
          subtitle={`Monthly ${year} totals in ${settings.reportingCurrency}.`}
          data={planBars}
          series={[
            { key: "planned", name: "Planned", color: CHART_ACCENT },
            { key: "actual", name: "Actual spending", color: "#3d9b6a" },
          ]}
          currency={settings.reportingCurrency}
          emptyMessage="No plan or expense data for this year."
        />
        <DonutChart
          title="Planned allocation"
          subtitle="Annual plan by category; this is not an investment classification."
          segments={allocations}
          currency={settings.reportingCurrency}
          centerLabel={matrix.grandTotal === null ? "Unavailable" : formatMinor(matrix.grandTotal, settings.reportingCurrency)}
          centerSubLabel="Total plan"
          emptyMessage="No planned allocations for this year."
        />
      </div>

      <div className="max-w-md">
        <AddCategoryForm />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="border-b border-line table-header text-left">
              <th scope="col" className="sticky left-0 table-header px-3 py-2 font-semibold">
                Category
              </th>
              {MONTH_ABBR.map((m) => (
                <th key={m} scope="col" className="px-2 py-2 text-right font-semibold">
                  {m}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                Total
              </th>
              <th scope="col" className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <tr key={row.categoryId} className="border-b border-line align-top">
                <th
                  scope="row"
                  className={`sticky left-0 table-sticky px-3 py-2 text-left font-medium ${
                    row.archived ? "text-ink-faint line-through" : "text-ink"
                  }`}
                >
                  {row.categoryName}
                </th>
                {row.planned.map((planned, monthIdx) => (
                  <td key={monthIdx} className="px-2 py-2 text-right">
                    {row.archived ? (
                      <span className="tabular-nums text-ink-faint">
                        <Money minor={planned} currency={settings.reportingCurrency} />
                      </span>
                    ) : (
                      <PlanCellInput
                        categoryId={row.categoryId}
                        year={year}
                        month={monthIdx + 1}
                        valueMinor={row.plannedRaw[monthIdx]}
                      />
                    )}
                    <p className="mt-0.5 text-[10px] tabular-nums text-ink-faint">
                      <Money minor={row.actual[monthIdx]} currency={settings.reportingCurrency} />
                    </p>
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">
                  <Money minor={row.rowTotal} currency={settings.reportingCurrency} />
                </td>
                <td className="px-3 py-2">
                  <CategoryRowActions
                    categoryId={row.categoryId}
                    categoryName={row.categoryName}
                    archived={row.archived}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="table-header font-semibold">
              <th scope="row" className="sticky left-0 table-header px-3 py-2 text-left">
                Month total
              </th>
              {matrix.columnTotals.map((total, monthIdx) => (
                <td key={monthIdx} className="px-2 py-2 text-right tabular-nums">
                  <Money minor={total} currency={settings.reportingCurrency} />
                </td>
              ))}
              <td className="px-3 py-2 text-right tabular-nums">
                <Money minor={matrix.grandTotal} currency={settings.reportingCurrency} />
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-ink-faint">
        Plan amounts are entered in CRC (₡); the small figure below each cell is the actual spend
        for that category and month in {settings.reportingCurrency}.
      </p>
      <RatesNote usdToCrc={settings.rates.usdToCrc} />
    </div>
  );
}
