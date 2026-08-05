import { Money } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { IncomeEntryRow } from "@/app/(app)/income/income-forms";
import { IncomeAddFab } from "@/components/add-income-sheet";
import { monthName, type HalfPeriod } from "@/lib/periods";
import type { Currency } from "@/lib/money";
import type { IncomeRow } from "@/lib/queries/income";

export function MobileIncome({
  year,
  month,
  currency,
  totalH1,
  totalH2,
  totalMonth,
  h1,
  h2,
  highlightPeriod,
  defaultPeriod,
}: {
  year: number;
  month: number;
  currency: Currency;
  totalH1: number | null;
  totalH2: number | null;
  totalMonth: number | null;
  h1: IncomeRow[];
  h2: IncomeRow[];
  highlightPeriod: HalfPeriod | null;
  defaultPeriod: "H1" | "H2";
}) {
  const entryCount = h1.length + h2.length;

  return (
    <div className="space-y-[18px] md:hidden">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.01em] text-ink">Income</h1>
        <p className="mt-1.5 mb-5 text-[13.5px] text-ink-muted">
          {monthName(month)} {year} · {entryCount}{" "}
          {entryCount === 1 ? "entry" : "entries"} recorded
        </p>
        <MonthPicker year={year} month={month} basePath="/income" variant="circles" />
      </header>

      <section className="card !rounded-[20px]">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              H1 (1–15)
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-ink">
              <Money minor={totalH1} currency={currency} />
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              H2 (16–end)
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-ink">
              <Money minor={totalH2} currency={currency} />
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              Month
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-brand-700 dark:text-brand-300">
              <Money minor={totalMonth} currency={currency} />
            </p>
          </div>
        </div>
      </section>

      <section className="card !rounded-[20px]">
        <h2 className="section-title">Half-month schedule</h2>
        <p className="mt-1 mb-4 text-[12.5px] text-ink-muted">Income entries by period</p>

        <div className="space-y-5">
          {(
            [
              {
                period: "H1" as const,
                title: "H1 (1st – 15th)",
                entries: h1,
              },
              {
                period: "H2" as const,
                title: "H2 (16th – end)",
                entries: h2,
              },
            ] as const
          ).map((section) => {
            const active = highlightPeriod === section.period;
            return (
              <div key={section.period}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-bold text-ink">{section.title}</h3>
                  {active ? (
                    <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                      Current
                    </span>
                  ) : null}
                </div>
                {section.entries.length === 0 ? (
                  <div className="rounded-xl bg-surface-muted px-3 py-4 text-sm text-ink-faint">
                    No entries yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-line rounded-xl border border-line px-3">
                    {section.entries.map((entry) => (
                      <IncomeEntryRow
                        key={entry.id}
                        entry={entry}
                        year={year}
                        month={month}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <IncomeAddFab year={year} month={month} defaultPeriod={defaultPeriod} />
    </div>
  );
}
