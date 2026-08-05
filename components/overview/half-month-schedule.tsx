import { Money } from "@/components/money";
import type { Currency } from "@/lib/money";
import type { OverviewFigures } from "@/lib/queries/overview";
import type { HalfPeriod } from "@/lib/periods";

const ROWS: Array<{
  period: HalfPeriod;
  title: string;
  subtitle: string;
}> = [
  { period: "H1", title: "H1", subtitle: "1st – 15th" },
  { period: "H2", title: "H2", subtitle: "16th – end" },
];

export function HalfMonthSchedule({
  perPeriod,
  currency,
  highlightPeriod,
  layout = "stack",
}: {
  perPeriod: OverviewFigures["perPeriod"];
  currency: Currency;
  /** Current half-month when viewing the current calendar month; otherwise null. */
  highlightPeriod: HalfPeriod | null;
  layout?: "stack" | "columns";
}) {
  return (
    <section className={`card h-full ${layout === "columns" ? "!rounded-[20px]" : ""}`}>
      <h2 className="section-title mb-1">Half-month schedule</h2>
      <p className="mb-4 text-xs text-ink-muted">Earned, spent, and saved by period</p>
      <ul className={layout === "columns" ? "flex gap-2.5" : "space-y-3"}>
        {ROWS.map((row) => {
          const figures = perPeriod[row.period];
          const active = highlightPeriod === row.period;
          return (
            <li
              key={row.period}
              className={`rounded-card px-3 py-3 ${layout === "columns" ? "min-w-0 flex-1 !rounded-[14px]" : ""} ${
                active
                  ? "bg-brand-100 ring-1 ring-brand-200 dark:bg-surface-muted dark:ring-brand-600"
                  : "panel-soft"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {row.title}
                    {active ? (
                      <span className="ml-2 rounded-md bg-surface-card px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-surface-elevated dark:text-brand-300">
                        Current
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-ink-muted">{row.subtitle}</p>
                </div>
              </div>
              {layout === "columns" ? (
                <dl className="mt-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Earned</dt>
                    <dd className="font-semibold tabular-nums text-ink">
                      <Money minor={figures.earned} currency={currency} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Spent</dt>
                    <dd className="font-semibold tabular-nums text-ink">
                      <Money minor={figures.spent} currency={currency} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Saved</dt>
                    <dd className="font-semibold tabular-nums text-ink">
                      <Money minor={figures.saved} currency={currency} />
                    </dd>
                  </div>
                </dl>
              ) : (
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-ink-faint">Earned</dt>
                    <dd className="font-semibold tabular-nums text-ink">
                      <Money minor={figures.earned} currency={currency} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">Spent</dt>
                    <dd className="font-semibold tabular-nums text-ink">
                      <Money minor={figures.spent} currency={currency} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">Saved</dt>
                    <dd className="font-semibold tabular-nums text-ink">
                      <Money minor={figures.saved} currency={currency} />
                    </dd>
                  </div>
                </dl>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
