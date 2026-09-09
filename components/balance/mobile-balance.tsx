"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Money } from "@/components/money";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { CHART_ACCENT } from "@/lib/chart-colors";
import { periodLabel } from "@/lib/periods";
import type { Currency } from "@/lib/money";
import type { BalancePeriodRow } from "@/lib/queries/balance";
import type { BalanceAccountView, SavingsMonthBreakdown } from "@/lib/queries/accounts";
import { AccountCards } from "@/components/balance/account-section";
import { AddAccountSheet } from "@/components/balance/add-account-sheet";

const PERIOD_NEG = "text-[#b3423a]";
const PERIOD_POS_NET = "text-[#2d6a4f]";
const PERIOD_INK = "text-[#141715] dark:text-ink";

function periodKey(row: BalancePeriodRow): string {
  return `${row.ref.year}-${row.ref.month}-${row.ref.period}`;
}

export function MobileBalance({
  currency,
  startingBalance,
  currentBalance,
  rows,
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
  startingBalance: number | null;
  currentBalance: number | null;
  rows: BalancePeriodRow[];
  chartRows: Array<{
    label: string;
    runningBalance: number | null;
    income: number | null;
    expenses: number | null;
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen] = useState(false);
  const currentNegative = currentBalance !== null && currentBalance < 0;
  const emptyMessage = "No income or expenses recorded yet.";

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-[18px] md:hidden">
      <header>
        <h1 className="text-[26px] font-bold tracking-[-0.01em] text-ink">
          Balance and accounts
        </h1>
      </header>

      <section className="card !rounded-[20px]" aria-label="Balance summary">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
              Starting balance
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">
              <Money minor={startingBalance} currency={currency} />
            </p>
            <Link
              href="/settings"
              className="mt-1 inline-block text-xs font-semibold text-brand-700 dark:text-brand-300"
            >
              Edit
            </Link>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
              Current balance
            </p>
            <p
              className={`mt-1 text-xl font-bold tabular-nums ${
                currentNegative
                  ? "text-red-600 dark:text-red-400"
                  : "text-ink"
              }`}
            >
              <Money minor={currentBalance} currency={currency} />
            </p>
          </div>
        </div>
      </section>

      <section className="card !rounded-[20px]">
        <h2 className="section-title">Running balance</h2>
        <p className="mt-1 mb-3 text-xs text-ink-muted">Balance by half-month period</p>
        <LineChart
          title="Running balance"
          data={chartRows}
          series={[{ key: "runningBalance", name: "Running balance", color: CHART_ACCENT }]}
          currency={currency}
          emptyMessage={emptyMessage}
          embedded
          compact
        />
      </section>

      <section className="card !rounded-[20px]">
        <h2 className="section-title">Income versus expenses</h2>
        <p className="mt-1 mb-3 text-xs text-ink-muted">Half-month totals</p>
        <BarChart
          title="Income versus expenses"
          data={chartRows}
          series={[
            { key: "income", name: "Income", color: "#3d9b6a" },
            { key: "expenses", name: "Expenses", color: "#b7c2bb" },
          ]}
          currency={currency}
          emptyMessage={emptyMessage}
          embedded
          compact
        />
      </section>

      <section className="card !rounded-[20px] !p-5">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          Running balance by half-month
        </h2>
        <p className="mt-1 mb-4 text-xs text-[#8a988f]">Tap a period to see its breakdown</p>

        {rows.length === 0 ? (
          <p className="rounded-[14px] bg-[#f6f7f5] px-3.5 py-3.5 text-sm text-ink-faint dark:bg-surface-muted">
            {emptyMessage}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {rows.map((row, index) => {
              const key = periodKey(row);
              const isOpen = !!expanded[key];
              const balanceNegative =
                row.runningBalance !== null && row.runningBalance < 0;
              const netNegative = row.net !== null && row.net < 0;
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggle(key)}
                    className={`w-full rounded-[14px] p-3.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                      index % 2 === 0
                        ? "bg-[#f6f7f5] dark:bg-surface-muted"
                        : "bg-white dark:bg-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`min-w-0 text-[13.5px] font-semibold ${PERIOD_INK}`}>
                        {periodLabel(row.ref)}
                      </span>
                      <span
                        className={`shrink-0 text-sm font-bold tabular-nums ${
                          balanceNegative ? PERIOD_NEG : PERIOD_INK
                        }`}
                      >
                        <Money minor={row.runningBalance} currency={currency} />
                      </span>
                    </div>

                    {isOpen ? (
                      <div className="mt-3 grid grid-cols-3 gap-2.5 border-t border-[rgba(20,30,25,0.08)] pt-3 dark:border-line">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.04em] text-[#8a988f]">
                            Income
                          </p>
                          <p
                            className={`mt-[3px] text-[12.5px] font-semibold tabular-nums ${PERIOD_INK}`}
                          >
                            <Money minor={row.income} currency={currency} />
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.04em] text-[#8a988f]">
                            Expenses
                          </p>
                          <p
                            className={`mt-[3px] text-[12.5px] font-semibold tabular-nums ${PERIOD_NEG}`}
                          >
                            <Money minor={row.expenses} currency={currency} />
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.04em] text-[#8a988f]">
                            Net
                          </p>
                          <p
                            className={`mt-[3px] text-[12.5px] font-semibold tabular-nums ${
                              netNegative ? PERIOD_NEG : PERIOD_POS_NET
                            }`}
                          >
                            <Money minor={row.net} currency={currency} />
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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
            Create a Main, Savings, or Custom account. Current balance above stays total cash.
          </p>
        ) : (
          <AccountCards
            accounts={accounts}
            breakdown={breakdown}
            leftoverHintMinor={leftoverHintMinor}
            currency={currency}
            defaultDate={defaultDate}
            startingOpeningPrefill={startingOpeningPrefill}
            startingOpeningCurrency={startingOpeningCurrency}
            compact
          />
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
