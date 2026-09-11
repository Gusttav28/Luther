"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Money } from "@/components/money";
import { BarChart } from "@/components/charts/bar-chart";
import type { Currency } from "@/lib/money";
import type { MonthSpendSaveRow } from "@/lib/queries/balance-months";
import type { BalanceAccountView, SavingsMonthBreakdown } from "@/lib/queries/accounts";
import { AccountCards } from "@/components/balance/account-section";
import { AddAccountSheet } from "@/components/balance/add-account-sheet";

const PERIOD_NEG = "text-[#b3423a]";
const PERIOD_INK = "text-[#141715] dark:text-ink";

export function MobileBalance({
  currency,
  monthRows,
  chartRows,
  accounts,
  breakdown,
  leftoverHintMinor,
  defaultDate,
  hasMain,
  hasSavings,
  startingOpeningPrefill,
  startingOpeningCurrency,
}: {
  currency: Currency;
  monthRows: MonthSpendSaveRow[];
  chartRows: Array<{
    label: string;
    spent: number | null;
    saved: number | null;
  }>;
  accounts: BalanceAccountView[];
  breakdown: SavingsMonthBreakdown;
  leftoverHintMinor: number | null;
  defaultDate: string;
  hasMain: boolean;
  hasSavings: boolean;
  startingOpeningPrefill: string;
  startingOpeningCurrency: Currency;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const emptyMessage = "No spent or saved months yet.";

  return (
    <div className="space-y-[18px] md:hidden">
      <header>
        <h1 className="text-[26px] font-bold tracking-[-0.01em] text-ink">
          Balance and accounts
        </h1>
      </header>

      <section className="card !rounded-[20px] !p-5" aria-label="Accounts">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-ink">Accounts</h2>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-brand-300"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            Add account
          </button>
        </div>
        {accounts.length === 0 ? (
          <p className="rounded-[14px] bg-[#f6f7f5] px-3.5 py-3.5 text-sm text-ink-faint dark:bg-surface-muted">
            Create a Main, Savings, or Custom account.
          </p>
        ) : (
          <AccountCards
            accounts={accounts}
            breakdown={breakdown}
            leftoverHintMinor={leftoverHintMinor}
            currency={currency}
            defaultDate={defaultDate}
            compact
          />
        )}
      </section>

      <section className="card !rounded-[20px]">
        <h2 className="section-title">Spent versus saved</h2>
        <p className="mt-1 mb-3 text-xs text-ink-muted">Already charged expenses and leftover take by month</p>
        <BarChart
          title="Spent versus saved"
          data={chartRows}
          series={[
            { key: "spent", name: "Spent", color: "#b7c2bb" },
            { key: "saved", name: "Saved", color: "#3d9b6a" },
          ]}
          currency={currency}
          emptyMessage={emptyMessage}
          embedded
          compact
        />
      </section>

      <section className="card !rounded-[20px] !p-5">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          Spent and saved by month
        </h2>
        <p className="mt-1 mb-4 text-xs text-[#8a988f]">Newest month first</p>

        {monthRows.length === 0 ? (
          <p className="rounded-[14px] bg-[#f6f7f5] px-3.5 py-3.5 text-sm text-ink-faint dark:bg-surface-muted">
            {emptyMessage}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {monthRows.map((row) => (
              <li
                key={`${row.year}-${row.month}`}
                className="rounded-[14px] bg-[#f6f7f5] p-3.5 dark:bg-surface-muted"
              >
                <p className={`text-[13.5px] font-semibold ${PERIOD_INK}`}>{row.label}</p>
                <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-[rgba(20,30,25,0.08)] pt-3 dark:border-line">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.04em] text-[#8a988f]">
                      Spent
                    </p>
                    <p className={`mt-[3px] text-[12.5px] font-semibold tabular-nums ${PERIOD_NEG}`}>
                      <Money minor={row.spentMinor} currency={currency} />
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.04em] text-[#8a988f]">
                      Saved
                    </p>
                    <p className={`mt-[3px] text-[12.5px] font-semibold tabular-nums ${PERIOD_INK}`}>
                      <Money minor={row.savedMinor} currency={currency} />
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddAccountSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        hasMain={hasMain}
        hasSavings={hasSavings}
        startingOpeningPrefill={startingOpeningPrefill}
        startingOpeningCurrency={startingOpeningCurrency}
        defaultCurrency={currency}
      />
    </div>
  );
}
