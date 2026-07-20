import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getPlanMatrix } from "@/lib/queries/plan";
import { Money, RatesNote } from "@/components/money";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Category plan</h1>
        <div className="flex items-center gap-2">
          <Link href={`/plan?year=${year - 1}`} aria-label="Previous year" className="btn-secondary px-2.5">
            ‹
          </Link>
          <span className="min-w-16 text-center text-sm font-semibold">{year}</span>
          <Link href={`/plan?year=${year + 1}`} aria-label="Next year" className="btn-secondary px-2.5">
            ›
          </Link>
        </div>
      </div>

      <div className="max-w-md">
        <AddCategoryForm />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left">
              <th scope="col" className="sticky left-0 bg-stone-50 px-3 py-2 font-semibold">
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
              <tr key={row.categoryId} className="border-b border-stone-100 align-top">
                <th
                  scope="row"
                  className={`sticky left-0 bg-white px-3 py-2 text-left font-medium ${
                    row.archived ? "text-stone-400 line-through" : ""
                  }`}
                >
                  {row.categoryName}
                </th>
                {row.planned.map((planned, monthIdx) => (
                  <td key={monthIdx} className="px-2 py-2 text-right">
                    {row.archived ? (
                      <span className="tabular-nums text-stone-400">
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
                    <p className="mt-0.5 text-[10px] text-stone-400 tabular-nums">
                      <Money minor={row.actual[monthIdx]} currency={settings.reportingCurrency} />
                    </p>
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
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
            <tr className="bg-stone-50 font-semibold">
              <th scope="row" className="sticky left-0 bg-stone-50 px-3 py-2 text-left">
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
      <p className="text-xs text-stone-400">
        Plan amounts are entered in CRC (₡); the small figure below each cell is the actual spend
        for that category and month in {settings.reportingCurrency}.
      </p>
      <RatesNote usdToCrc={settings.rates.usdToCrc} mxnToCrc={settings.rates.mxnToCrc} />
    </div>
  );
}
