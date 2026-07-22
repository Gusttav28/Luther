import { Money } from "@/components/money";
import type { Currency } from "@/lib/money";
import type { SpentByCategoryResult } from "@/lib/queries/overview-dashboard";
import { CHART_PALETTE } from "@/lib/chart-colors";

const SEGMENT_COLORS = [...CHART_PALETTE, "#737373", "#a3a3a3"];

export function SpentByCategory({
  data,
  currency,
}: {
  data: SpentByCategoryResult;
  currency: Currency;
}) {
  const empty = data.categories.length === 0;

  return (
    <section className="card h-full">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Spent by category</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Share of this month&apos;s expenses</p>
        </div>
        <p className="text-lg font-bold tabular-nums text-ink">
          <Money minor={data.totalMinor} currency={currency} />
        </p>
      </div>

      {empty ? (
        <div className="flex h-32 items-center justify-center rounded-lg surface-muted text-sm text-ink-faint">
          No expenses this month.
        </div>
      ) : (
        <>
          <div
            className="mb-4 flex h-3 overflow-hidden rounded-full surface-muted"
            role="img"
            aria-label="Category spend distribution"
          >
            {data.categories.map((cat, i) => {
              const width =
                cat.share !== null ? Math.max(cat.share * 100, cat.amountMinor ? 2 : 0) : 0;
              if (width <= 0) return null;
              return (
                <div
                  key={cat.categoryId}
                  className="h-full"
                  style={{
                    width: `${width}%`,
                    backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                  }}
                  title={cat.name}
                />
              );
            })}
          </div>
          <ul className="flex flex-wrap gap-2">
            {data.categories.map((cat, i) => (
              <li
                key={cat.categoryId}
                className="inline-flex items-center gap-2 rounded-full surface-muted px-3 py-1.5 text-xs"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                  aria-hidden
                />
                <span className="font-medium text-ink-secondary">{cat.name}</span>
                <span className="tabular-nums text-ink-muted">
                  <Money minor={cat.amountMinor} currency={currency} />
                </span>
                {cat.share !== null ? (
                  <span className="tabular-nums text-ink-faint">
                    {(cat.share * 100).toFixed(0)}%
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
