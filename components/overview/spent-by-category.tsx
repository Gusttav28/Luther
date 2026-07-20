import { Money } from "@/components/money";
import type { Currency } from "@/lib/money";
import type { SpentByCategoryResult } from "@/lib/queries/overview-dashboard";

const SEGMENT_COLORS = [
  "#d95a45",
  "#e97a66",
  "#f3a99a",
  "#3d9b6a",
  "#6b8f71",
  "#a8a29e",
  "#78716c",
  "#57534e",
];

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
          <p className="mt-0.5 text-xs text-stone-500">Share of this month&apos;s expenses</p>
        </div>
        <p className="text-lg font-bold tabular-nums text-stone-900">
          <Money minor={data.totalMinor} currency={currency} />
        </p>
      </div>

      {empty ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-stone-50 text-sm text-stone-400">
          No expenses this month.
        </div>
      ) : (
        <>
          <div
            className="mb-4 flex h-3 overflow-hidden rounded-full bg-stone-100"
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
                className="inline-flex items-center gap-2 rounded-full bg-stone-50 px-3 py-1.5 text-xs"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                  aria-hidden
                />
                <span className="font-medium text-stone-700">{cat.name}</span>
                <span className="tabular-nums text-stone-500">
                  <Money minor={cat.amountMinor} currency={currency} />
                </span>
                {cat.share !== null ? (
                  <span className="tabular-nums text-stone-400">
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
