import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getBalanceSeries } from "@/lib/queries/balance";
import { getBalanceAccountsPage } from "@/lib/queries/accounts";
import { getBalanceMonthRows } from "@/lib/queries/balance-months";
import { Money, RatesNote } from "@/components/money";
import { BarChart } from "@/components/charts/bar-chart";
import { MobileBalance } from "@/components/balance/mobile-balance";
import { AccountCards } from "@/components/balance/account-section";
import { AddAccountForm } from "@/app/(app)/balance/account-forms";

export const dynamic = "force-dynamic";

export default async function BalancePage() {
  const userId = await requireUserId();
  const settings = await getSettings(userId);
  const [series, accountsPage, monthRows] = await Promise.all([
    getBalanceSeries(userId, settings),
    getBalanceAccountsPage(userId, settings),
    getBalanceMonthRows(userId, settings),
  ]);
  const chartRows = monthRows.map((row) => ({
    label: row.label,
    spent: row.spentMinor,
    saved: row.savedMinor,
  }));
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-7xl">
      <MobileBalance
        currency={settings.reportingCurrency}
        startingBalance={series.startingBalance}
        currentBalance={series.currentBalance}
        monthRows={monthRows}
        chartRows={chartRows}
        accounts={accountsPage.accounts}
        breakdown={accountsPage.breakdown}
        leftoverHintMinor={accountsPage.leftoverHintMinor}
        defaultDate={defaultDate}
        hasMain={accountsPage.hasMain}
        hasSavings={accountsPage.hasSavings}
        startingOpeningPrefill={accountsPage.startingOpeningPrefill}
        startingOpeningCurrency={accountsPage.startingOpeningCurrency}
      />

      <div className="hidden space-y-6 md:block">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="page-title">Balance and accounts</h1>
          <RatesNote usdToCrc={settings.rates.usdToCrc} />
        </div>

        <section className="space-y-4" aria-label="Accounts">
          <div>
            <h2 className="text-base font-semibold">Accounts</h2>
            {accountsPage.accounts.length === 0 ? (
              <p className="mt-1 text-sm text-ink-muted">
                Create a Main, Savings, or Custom account. Starting and current totals below stay
                total cash.
              </p>
            ) : null}
          </div>
          <AccountCards
            accounts={accountsPage.accounts}
            breakdown={accountsPage.breakdown}
            leftoverHintMinor={accountsPage.leftoverHintMinor}
            currency={settings.reportingCurrency}
            defaultDate={defaultDate}
          />
          <AddAccountForm
            hasMain={accountsPage.hasMain}
            hasSavings={accountsPage.hasSavings}
            startingOpeningPrefill={accountsPage.startingOpeningPrefill}
            startingOpeningCurrency={accountsPage.startingOpeningCurrency}
            defaultCurrency={settings.reportingCurrency}
            variant="card"
          />
        </section>

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

        <section className="grid min-w-0 gap-4" aria-label="Spent versus saved">
          <BarChart
            title="Spent versus saved"
            subtitle="Charged expenses and leftover take by calendar month."
            data={chartRows}
            series={[
              { key: "spent", name: "Spent", color: "#737373" },
              { key: "saved", name: "Saved", color: "#3d9b6a" },
            ]}
            currency={settings.reportingCurrency}
            emptyMessage="No spent or saved months yet."
          />
        </section>

        <section className="card">
          <h2 className="mb-3 text-base font-semibold">Spent and saved by month</h2>
          {monthRows.length === 0 ? (
            <p className="py-3 text-sm text-stone-400">No spent or saved months yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500 dark:border-neutral-800">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Month
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">
                      Spent
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      Saved
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((row) => (
                    <tr
                      key={`${row.year}-${row.month}`}
                      className="border-b border-stone-100 last:border-0 dark:border-neutral-800"
                    >
                      <th scope="row" className="py-2 pr-4 text-left font-medium">
                        {row.label}
                      </th>
                      <td className="py-2 pr-4 text-right tabular-nums text-red-600">
                        <Money minor={row.spentMinor} currency={settings.reportingCurrency} />
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums text-brand-accent">
                        <Money minor={row.savedMinor} currency={settings.reportingCurrency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
