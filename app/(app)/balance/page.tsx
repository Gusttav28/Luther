import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getBalanceSeries } from "@/lib/queries/balance";
import { periodLabel } from "@/lib/periods";
import { Money, RatesNote } from "@/components/money";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { CHART_ACCENT } from "@/lib/chart-colors";

export const dynamic = "force-dynamic";

export default async function BalancePage() {
  const userId = await requireUserId();
  const settings = await getSettings(userId);
  const series = await getBalanceSeries(userId, settings);
  const chartRows = series.rows.map((row) => ({
    label: periodLabel(row.ref),
    runningBalance: row.runningBalance,
    income: row.income,
    expenses: row.expenses,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="page-title">Balance</h1>
        <RatesNote usdToCrc={settings.rates.usdToCrc} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Balance summary">
        <div className="card">
          <p className="field-label">Starting balance</p>
          <p className="text-xl font-bold tabular-nums">
            <Money minor={series.startingBalance} currency={settings.reportingCurrency} />
          </p>
          <Link href="/settings" className="mt-1 inline-block text-xs text-brand-accent underline">
            Edit in settings
          </Link>
        </div>
        <div className="card ring-1 ring-brand-100 dark:ring-white/20">
          <p className="field-label">Current balance</p>
          <p className="text-2xl font-bold tabular-nums text-brand-accent">
            <Money minor={series.currentBalance} currency={settings.reportingCurrency} />
          </p>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 md:grid-cols-2" aria-label="Balance analytics">
        <LineChart
          title="Running balance"
          subtitle="Balance by half-month period, matching the table below."
          data={chartRows}
          series={[{ key: "runningBalance", name: "Running balance", color: CHART_ACCENT }]}
          currency={settings.reportingCurrency}
          emptyMessage="No income or expenses recorded yet."
        />
        <BarChart
          title="Income versus expenses"
          subtitle="Half-month totals in the configured reporting currency."
          data={chartRows}
          series={[
            { key: "income", name: "Income", color: "#3d9b6a" },
            { key: "expenses", name: "Expenses", color: "#737373" },
          ]}
          currency={settings.reportingCurrency}
          emptyMessage="No income or expenses recorded yet."
        />
      </section>

      <section className="card">
        <h2 className="mb-3 text-base font-semibold">Running balance by half-month</h2>
        {series.rows.length === 0 ? (
          <p className="py-3 text-sm text-stone-400">
            No income or expenses recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Period
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Income
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Expenses
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Net
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {series.rows.map((row) => (
                  <tr
                    key={`${row.ref.year}-${row.ref.month}-${row.ref.period}`}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <th scope="row" className="py-2 pr-4 text-left font-medium">
                      {periodLabel(row.ref)}
                    </th>
                    <td className="py-2 pr-4 text-right tabular-nums text-brand-accent">
                      <Money minor={row.income} currency={settings.reportingCurrency} />
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-red-600">
                      <Money minor={row.expenses} currency={settings.reportingCurrency} />
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      <Money minor={row.net} currency={settings.reportingCurrency} />
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      <Money minor={row.runningBalance} currency={settings.reportingCurrency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
