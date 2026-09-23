"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Money, RatesNote } from "@/components/money";
import type { Currency } from "@/lib/money";
import type { CategoryOption } from "@/components/category-picker";
import { childrenOf, findCategory, rootsOf } from "@/lib/category-tree";

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

  const nodes = categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId ?? null,
    archived: c.archived,
  }));
  const rootCategories = rootsOf(nodes.filter((c) => !c.archived));
  const selected = findCategory(nodes, categoryId);
  const selectedRootId = selected?.parentId ?? selected?.id;

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
        {rootCategories.map((c) => (
          <CategoryFilterChip
            key={c.id}
            parent={c}
            childCategories={childrenOf(
              nodes.filter((n) => !n.archived),
              c.id
            )}
            selectedId={categoryId}
            selectedRootId={selectedRootId}
            pending={pending}
            onSelect={(id) => navigate(id, period)}
          />
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
            {rootCategories.map((root) => {
              const kids = childrenOf(
                nodes.filter((n) => !n.archived),
                root.id
              );
              return (
                <optgroup key={root.id} label={root.name}>
                  <option value={root.id}>{root.name} (all)</option>
                  {kids.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
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

function CategoryFilterChip({
  parent,
  childCategories,
  selectedId,
  selectedRootId,
  pending,
  onSelect,
}: {
  parent: { id: string; name: string };
  childCategories: Array<{ id: string; name: string }>;
  selectedId?: string;
  selectedRootId?: string;
  pending: boolean;
  onSelect: (id: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const parentActive = selectedRootId === parent.id;
  const childActive = childCategories.some((child) => child.id === selectedId);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        disabled={pending}
        onClick={() => onSelect(parent.id)}
        className={`chip ${parentActive ? "chip-active" : ""} ${childCategories.length ? "!rounded-r-none" : ""}`}
        aria-pressed={parentActive && !childActive}
      >
        {parent.name}
        {childActive ? (
          <span className="ml-1 font-normal opacity-80">
            · {childCategories.find((c) => c.id === selectedId)?.name}
          </span>
        ) : null}
      </button>
      {childCategories.length > 0 ? (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => setOpen((value) => !value)}
            className={`chip !rounded-l-none !px-1.5 ${parentActive ? "chip-active" : ""}`}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`Subcategories of ${parent.name}`}
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </button>
          {open ? (
            <ul
              className="absolute left-0 top-full z-20 mt-1 min-w-[10rem] rounded-xl border border-line bg-surface-card py-1 shadow-lg"
              role="listbox"
              aria-label={`${parent.name} subcategories`}
            >
              <li>
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-surface-muted"
                  onClick={() => {
                    onSelect(parent.id);
                    setOpen(false);
                  }}
                >
                  {parent.name} (all)
                </button>
              </li>
              {childCategories.map((child) => (
                <li key={child.id}>
                  <button
                    type="button"
                    className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-surface-muted ${
                      selectedId === child.id ? "font-semibold text-brand-800 dark:text-brand-300" : ""
                    }`}
                    onClick={() => {
                      onSelect(child.id);
                      setOpen(false);
                    }}
                  >
                    {child.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
