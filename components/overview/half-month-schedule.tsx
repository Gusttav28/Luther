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
}: {
  perPeriod: OverviewFigures["perPeriod"];
  currency: Currency;
  /** Current half-month when viewing the current calendar month; otherwise null. */
  highlightPeriod: HalfPeriod | null;
}) {
  return (
    <section className="card h-full">
      <h2 className="section-title mb-1">Half-month schedule</h2>
      <p className="mb-4 text-xs text-stone-500">Earned, spent, and saved by period</p>
      <ul className="space-y-3">
        {ROWS.map((row) => {
          const figures = perPeriod[row.period];
          const active = highlightPeriod === row.period;
          return (
            <li
              key={row.period}
              className={`rounded-card px-3 py-3 ${
                active ? "bg-brand-50 ring-1 ring-brand-200" : "bg-stone-50"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-800">
                    {row.title}
                    {active ? (
                      <span className="ml-2 text-xs font-medium text-brand-600">Current</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-stone-500">{row.subtitle}</p>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-stone-400">Earned</dt>
                  <dd className="font-semibold tabular-nums text-stone-800">
                    <Money minor={figures.earned} currency={currency} />
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-400">Spent</dt>
                  <dd className="font-semibold tabular-nums text-stone-800">
                    <Money minor={figures.spent} currency={currency} />
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-400">Saved</dt>
                  <dd className="font-semibold tabular-nums text-stone-800">
                    <Money minor={figures.saved} currency={currency} />
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
