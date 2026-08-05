"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Money, RatesNote } from "@/components/money";
import type { Currency } from "@/lib/money";
import type { CategoryOption } from "@/components/category-picker";

export type HalfFilter = "ALL" | "H1" | "H2";

const HALF_OPTIONS: { key: HalfFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "H1", label: "1–15" },
  { key: "H2", label: "16+" },
];

const HALF_OPTIONS_DESKTOP: { key: HalfFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "H1", label: "1–15" },
  { key: "H2", label: "16–end" },
];

function buildFilterHref(
  year: number,
  month: number,
  categoryId: string | undefined,
  half: HalfFilter
): string {
  const p = new URLSearchParams({ year: String(year), month: String(month) });
  if (categoryId) p.set("category", categoryId);
  if (half !== "ALL") p.set("period", half);
  return `/expenses?${p.toString()}`;
}

export function ExpensesTable({
  year,
  month,
  categoryId,
  categories,
  period,
  expenseCount,
  displayTotal,
  trackedTotalMinor,
  reportingCurrency,
  usdToCrc,
  children,
}: {
  year: number;
  month: number;
  categoryId?: string;
  categories: CategoryOption[];
  period: HalfFilter;
  expenseCount: number;
  displayTotal: number | null;
  trackedTotalMinor: number | null;
  reportingCurrency: Currency;
  usdToCrc: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function navigate(nextCategoryId: string | undefined, nextHalf: HalfFilter) {
    const sameCategory = (nextCategoryId ?? "") === (categoryId ?? "");
    const sameHalf = nextHalf === period;
    if ((sameCategory && sameHalf) || pending) return;
    startTransition(() => {
      router.push(buildFilterHref(year, month, nextCategoryId, nextHalf), { scroll: false });
    });
  }

  const donePercent =
    displayTotal !== null && trackedTotalMinor !== null && trackedTotalMinor > 0
      ? Math.min(100, Math.round((displayTotal / trackedTotalMinor) * 100))
      : 0;

  return (
    <div className="space-y-3">
      {/* Mobile: marked-done summary */}
      <section
        className="card !rounded-[20px] md:hidden"
        aria-label="Marked done summary"
      >
        <h2 className="text-base font-semibold text-ink">Marked done</h2>
        <p className="mt-0.5 text-xs text-ink-muted">Total paid so far this month</p>
        <p className="mt-3 text-[28px] font-bold tracking-tight tabular-nums text-ink">
          <Money minor={displayTotal} currency={reportingCurrency} />
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand-700 transition-all dark:bg-brand-500"
            style={{ width: `${donePercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-muted">
          <span>{donePercent}% of tracked</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Money minor={trackedTotalMinor} currency={reportingCurrency} />
            <span>total</span>
          </span>
        </div>
      </section>

      {/* Desktop category chips */}
      <div
        className="hidden flex-wrap items-center gap-2 md:flex"
        role="group"
        aria-label="Filter by category"
      >
        <button
          type="button"
          disabled={pending}
          onClick={() => navigate(undefined, period)}
          className={`chip ${!categoryId ? "chip-active" : ""}`}
          aria-pressed={!categoryId}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={pending}
            onClick={() => navigate(c.id, period)}
            className={`chip ${categoryId === c.id ? "chip-active" : ""}`}
            aria-pressed={categoryId === c.id}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="card relative md:!rounded-[20px]">
        {/* Mobile filters */}
        <div className="mb-3 flex items-center gap-2 md:hidden">
          <label className="sr-only" htmlFor="expense-category-filter">
            Category
          </label>
          <select
            id="expense-category-filter"
            disabled={pending}
            value={categoryId ?? ""}
            onChange={(e) => navigate(e.target.value || undefined, period)}
            className="field-input min-w-0 flex-1 !py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div
            className="inline-flex shrink-0 rounded-[10px] bg-surface-muted p-0.5"
            role="group"
            aria-label="Filter by half of month"
          >
            {HALF_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                disabled={pending}
                onClick={() => navigate(categoryId, opt.key)}
                aria-pressed={period === opt.key}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-70 ${
                  period === opt.key
                    ? "bg-surface-card text-ink shadow-sm"
                    : "text-ink-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">
            {expenseCount} expense{expenseCount === 1 ? "" : "s"}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="hidden rounded-card border border-stone-200 p-0.5 md:inline-flex dark:border-neutral-700"
              role="group"
              aria-label="Filter by half of month"
            >
              {HALF_OPTIONS_DESKTOP.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  disabled={pending}
                  onClick={() => navigate(categoryId, opt.key)}
                  aria-pressed={period === opt.key}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition disabled:opacity-70 ${
                    period === opt.key
                      ? "bg-brand-800 text-white"
                      : "text-ink-secondary hover:bg-surface-muted hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-lg font-bold tabular-nums text-ink">
              <Money minor={displayTotal} currency={reportingCurrency} />
            </p>
          </div>
        </div>
        <RatesNote usdToCrc={usdToCrc} />

        <div className="relative mt-1 min-h-[4rem]">
          <div
            className={`transition-[filter,opacity] duration-150 ${
              pending ? "pointer-events-none opacity-60 blur-[2px]" : ""
            }`}
            aria-busy={pending}
          >
            {children}
          </div>

          {pending ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-surface/40"
              role="status"
              aria-live="polite"
              aria-label="Loading expenses"
            >
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-800 border-t-transparent dark:border-brand-400 dark:border-t-transparent" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
