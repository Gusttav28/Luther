"use client";

import { useEffect, useRef, useState } from "react";
import { Money } from "@/components/money";
import type { Currency } from "@/lib/money";
import type { CategorySpend, SpentByCategoryResult } from "@/lib/queries/overview-dashboard";
import { selectedCategoryTotal } from "@/lib/category-spend";
import { CHART_PALETTE } from "@/lib/chart-colors";

const SEGMENT_COLORS = [...CHART_PALETTE, "#737373", "#a3a3a3"];
const HOLD_MS = 500;

function CategoryBody({
  data,
  currency,
  layout,
  selectedIds,
  headlineMinor,
  onToggle,
  onInspect,
}: {
  data: SpentByCategoryResult;
  currency: Currency;
  layout: "chips" | "rows";
  selectedIds: string[];
  headlineMinor: number | null;
  onToggle: (categoryId: string) => void;
  onInspect: (category: CategorySpend, x: number, y: number) => void;
}) {
  const empty = data.categories.length === 0;
  const selecting = selectedIds.length > 0;

  if (empty) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg surface-muted text-sm text-ink-faint">
        No expenses this month.
      </div>
    );
  }

  return (
    <>
      {layout === "rows" ? (
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-[12.5px] text-ink-muted">
            {selecting ? "Selected" : "Total spent"}
          </span>
          <span className="text-lg font-bold tabular-nums text-ink">
            <Money minor={headlineMinor} currency={currency} />
          </span>
        </div>
      ) : null}
      <div
        className={`mb-4 flex overflow-hidden rounded-full surface-muted ${layout === "rows" ? "h-2" : "h-3"}`}
        role="img"
        aria-label="Category spend distribution"
      >
        {data.categories.map((cat, i) => {
          const width =
            cat.share !== null ? Math.max(cat.share * 100, cat.amountMinor ? 2 : 0) : 0;
          if (width <= 0) return null;
          const dim = selecting && !selectedIds.includes(cat.categoryId);
          return (
            <div
              key={cat.categoryId}
              className="h-full"
              style={{
                width: `${width}%`,
                backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                opacity: dim ? 0.35 : 1,
              }}
              title={cat.name}
            />
          );
        })}
      </div>
      {layout === "rows" ? (
        <ul className="flex flex-col gap-1.5">
          {data.categories.map((cat, i) => (
            <li key={cat.categoryId}>
              <CategoryPickButton
                category={cat}
                color={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                currency={currency}
                selected={selectedIds.includes(cat.categoryId)}
                layout="rows"
                onToggle={onToggle}
                onInspect={onInspect}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {data.categories.map((cat, i) => (
            <li key={cat.categoryId}>
              <CategoryPickButton
                category={cat}
                color={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                currency={currency}
                selected={selectedIds.includes(cat.categoryId)}
                layout="chips"
                onToggle={onToggle}
                onInspect={onInspect}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CategoryPickButton({
  category,
  color,
  currency,
  selected,
  layout,
  onToggle,
  onInspect,
}: {
  category: CategorySpend;
  color: string;
  currency: Currency;
  selected: boolean;
  layout: "chips" | "rows";
  onToggle: (categoryId: string) => void;
  onInspect: (category: CategorySpend, x: number, y: number) => void;
}) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdOpened = useRef(false);

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function inspectAt(x: number, y: number) {
    clearHold();
    holdOpened.current = true;
    onInspect(category, x, y);
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const { clientX, clientY } = event;
        holdOpened.current = false;
        clearHold();
        holdTimer.current = setTimeout(() => {
          inspectAt(clientX, clientY);
        }, HOLD_MS);
      }}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onPointerLeave={clearHold}
      onContextMenu={(event) => {
        event.preventDefault();
        inspectAt(event.clientX, event.clientY);
      }}
      onClick={() => {
        if (holdOpened.current) {
          holdOpened.current = false;
          return;
        }
        onToggle(category.categoryId);
      }}
      className={
        layout === "rows"
          ? `flex w-full select-none items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              selected
                ? "bg-brand-50 ring-1 ring-brand-600 dark:bg-brand-950/50 dark:ring-brand-400"
                : "hover:bg-surface-muted"
            }`
          : `inline-flex select-none items-center gap-2 rounded-full px-3 py-1.5 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              selected
                ? "bg-brand-50 ring-1 ring-brand-600 dark:bg-brand-950/50 dark:ring-brand-400"
                : "surface-muted"
            }`
      }
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span
        className={
          layout === "rows"
            ? "min-w-0 flex-1 truncate text-ink-secondary"
            : "font-medium text-ink-secondary"
        }
      >
        {category.name}
      </span>
      <span className={layout === "rows" ? "font-semibold tabular-nums text-ink" : "tabular-nums text-ink-muted"}>
        <Money minor={category.amountMinor} currency={currency} />
      </span>
      {category.share !== null ? (
        <span
          className={
            layout === "rows"
              ? "w-9 text-right tabular-nums text-ink-muted"
              : "tabular-nums text-ink-faint"
          }
        >
          {(category.share * 100).toFixed(0)}%
        </span>
      ) : null}
    </button>
  );
}

export function SpentByCategory({
  data,
  currency,
  variant = "card",
}: {
  data: SpentByCategoryResult;
  currency: Currency;
  variant?: "card" | "embedded";
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [popover, setPopover] = useState<{
    category: CategorySpend;
    x: number;
    y: number;
  } | null>(null);

  const headlineMinor =
    selectedIds.length === 0
      ? data.totalMinor
      : selectedCategoryTotal(data.categories, selectedIds);

  function toggle(categoryId: string) {
    setSelectedIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  }

  useEffect(() => {
    if (!popover) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPopover(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popover]);

  const body = (
    <CategoryBody
      data={data}
      currency={currency}
      layout={variant === "embedded" ? "rows" : "chips"}
      selectedIds={selectedIds}
      headlineMinor={headlineMinor}
      onToggle={toggle}
      onInspect={(category, x, y) => setPopover({ category, x, y })}
    />
  );

  const popoverNode = popover ? (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        aria-label="Close subcategory details"
        onClick={() => setPopover(null)}
      />
      <div
        role="dialog"
        aria-label={`${popover.category.name} subcategories`}
        className="fixed z-50 w-[min(16.5rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-surface-card px-3.5 py-3 shadow-xl"
        style={{
          top: Math.min(popover.y + 12, typeof window === "undefined" ? popover.y : window.innerHeight - 160),
          left: Math.min(popover.x, typeof window === "undefined" ? popover.x : window.innerWidth - 280),
        }}
      >
        <p className="text-sm font-semibold text-ink">{popover.category.name}</p>
        {popover.category.children.length === 0 ? (
          <p className="mt-1.5 text-xs text-ink-muted">No subcategories</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {popover.category.children.map((child) => (
              <li key={child.categoryId} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-ink-secondary">{child.name}</span>
                <span className="shrink-0 font-semibold tabular-nums text-ink">
                  <Money minor={child.amountMinor} currency={currency} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  ) : null;

  if (variant === "embedded") {
    return (
      <div className="relative">
        {body}
        {popoverNode}
      </div>
    );
  }

  return (
    <section className="card relative h-full">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Spent by category</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {selectedIds.length > 0
              ? "Sum of the selected categories"
              : "Share of this month's expenses"}
          </p>
        </div>
        <p className="text-lg font-bold tabular-nums text-ink">
          <Money minor={headlineMinor} currency={currency} />
        </p>
      </div>
      {body}
      {popoverNode}
    </section>
  );
}
