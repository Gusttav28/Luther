import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getBalanceSeries } from "@/lib/queries/balance";
import { Money, RatesNote } from "@/components/money";
import { periodLabel } from "@/lib/periods";

export const dynamic = "force-dynamic";

export default async function BalancePage() {
  const userId = await requireUserId();
  const settings = await getSettings(userId);
  const series = await getBalanceSeries(userId, settings);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Balance</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="field-label">Starting balance</p>
          <p className="text-xl font-bold tabular-nums">
            <Money minor={series.startingBalance} currency={settings.reportingCurrency} />
          </p>
          <Link href="/settings" className="mt-1 inline-block text-xs text-brand-600 underline">
            Edit in settings
          </Link>
        </div>
        <div className="card bg-stone-900 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
            Current balance
          </p>
          <p className="text-2xl font-bold tabular-nums">
            <Money minor={series.currentBalance} currency={settings.reportingCurrency} />
          </p>
        </div>
      </div>
      <RatesNote usdToCrc={settings.rates.usdToCrc} mxnToCrc={settings.rates.mxnToCrc} />

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
                    <td className="py-2 pr-4 text-right tabular-nums text-brand-700">
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
