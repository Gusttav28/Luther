"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Money } from "@/components/money";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { AddSavingsSheet } from "@/components/add-savings-sheet";
import { SavingsListRow } from "@/app/(app)/savings/savings-forms";
import type { Currency } from "@/lib/money";
import type { SavingsRow } from "@/lib/queries/savings";

export function MobileSavings({
  currency,
  balanceMinor,
  leftoverMinor,
  lifetimeTakeMinor,
  postLifetimeMinor,
  savingsTrend,
  contributionsTotal,
  withdrawalsTotal,
  conversionUnavailable,
  activityCenterLabel,
  contributions,
  defaultDate,
}: {
  currency: Currency;
  balanceMinor: number | null;
  leftoverMinor: number | null;
  lifetimeTakeMinor: number | null;
  postLifetimeMinor: number | null;
  savingsTrend: Array<{ label: string; contributions: number; withdrawals: number }>;
  contributionsTotal: number;
  withdrawalsTotal: number;
  conversionUnavailable: boolean;
  activityCenterLabel: string;
  contributions: SavingsRow[];
  defaultDate: string;
}) {
  const [recordOpen, setRecordOpen] = useState(false);
  const emptyMessage = conversionUnavailable
    ? "Unavailable until rates are set."
    : "No savings activity yet.";

  return (
    <div className="space-y-[18px] md:hidden">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.01em] text-ink">Lifetime savings</h1>
      </header>

      <section className="card !rounded-[20px] !px-5 !pb-4 !pt-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              Lifetime balance
            </p>
            <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight text-ink">
              <Money minor={balanceMinor} currency={currency} />
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              Budget left
            </p>
            <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight text-ink">
              <Money minor={leftoverMinor} currency={currency} />
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              Lifetime take (70%)
            </p>
            <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight text-ink">
              <Money minor={lifetimeTakeMinor} currency={currency} />
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              Left for projects (30%)
            </p>
            <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight text-ink">
              <Money minor={postLifetimeMinor} currency={currency} />
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-line pt-3.5 text-[12.5px] leading-relaxed text-ink-muted">
          Lifetime savings are always{" "}
          <strong className="font-semibold text-ink">70%</strong> of what remains after expenses
          from planned income. The form below is for manual corrections or withdrawals only.
        </p>
      </section>

      <section className="card !rounded-[20px]">
        <h2 className="section-title">Contributions over time</h2>
        <p className="mt-1 mb-3 text-[12.5px] text-ink-muted">
          Positive contributions and withdrawals by month
        </p>
        <BarChart
          title="Contributions over time"
          data={savingsTrend}
          series={[
            { key: "contributions", name: "Contributions", color: "#3d9b6a" },
            { key: "withdrawals", name: "Withdrawals", color: "#737373" },
          ]}
          currency={currency}
          emptyMessage={emptyMessage}
          embedded
          compact
        />
      </section>

      <section className="card !rounded-[20px]">
        <h2 className="section-title">Contributions vs withdrawals</h2>
        <p className="mt-1 mb-3 text-[12.5px] text-ink-muted">
          Signed savings activity grouped by direction
        </p>
        <DonutChart
          title="Contributions versus withdrawals"
          segments={[
            {
              key: "contributions",
              name: "Contributions",
              value: contributionsTotal,
              color: "#3d9b6a",
            },
            {
              key: "withdrawals",
              name: "Withdrawals",
              value: withdrawalsTotal,
              color: "#737373",
            },
          ]}
          currency={currency}
          centerLabel={activityCenterLabel}
          centerSubLabel="Activity"
          emptyMessage={emptyMessage}
          embedded
        />
      </section>

      <section className="card !rounded-[20px]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="section-title">History</h2>
          <button
            type="button"
            onClick={() => setRecordOpen(true)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-brand-300"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            Record
          </button>
        </div>

        {contributions.length === 0 ? (
          <p className="py-3 text-sm text-ink-faint">No contributions yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {contributions.map((row) => (
              <SavingsListRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>

      <AddSavingsSheet
        defaultDate={defaultDate}
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
      />
    </div>
  );
}
