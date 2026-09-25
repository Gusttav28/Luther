"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { Money } from "@/components/money";
import { formatMinor, type Currency } from "@/lib/money";
import { monthName } from "@/lib/periods";
import type { PlanMatrix, PlanMatrixRow } from "@/lib/queries/plan";
import { groupPlanRows, sumNullable, type PlanGroup } from "@/lib/plan-groups";
import {
  AddCategoryForm,
  CategoryRowActions,
  PlanCellInput,
} from "@/app/(app)/plan/plan-forms";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LETTER = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

type Tab = "month" | "year" | "totals";
type Parent = { id: string; name: string };

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:ring-offset-neutral-950";

function maxOf(values: (number | null)[]) {
  return values.reduce<number>((max, v) => (v !== null && v > max ? v : max), 0);
}

/** For amounts inside buttons, where the `Money` settings link cannot be nested. */
function PlainMoney({ minor, currency }: { minor: number | null; currency: Currency }) {
  if (minor === null) return <span className="text-xs text-amber-600">Rate needed</span>;
  return <>{formatMinor(minor, currency)}</>;
}

function YearBars({
  values,
  monthIndex,
  currency,
  label,
}: {
  values: (number | null)[];
  monthIndex: number;
  currency: Currency;
  label: string;
}) {
  const max = maxOf(values);
  return (
    <div>
      <div
        className="flex h-9 items-end gap-1"
        role="img"
        aria-label={`${label} by month: ${values
          .map((v, idx) => `${MONTH_ABBR[idx]} ${v === null ? "unavailable" : formatMinor(v, currency)}`)
          .join(", ")}`}
      >
        {values.map((value, idx) => {
          const pct = value && max > 0 ? Math.max(12, Math.round((value / max) * 100)) : 0;
          return (
            <span key={idx} className="flex h-full flex-1 items-end">
              {pct > 0 ? (
                <span
                  className="w-full rounded-[4px] bg-brand-700 dark:bg-brand-600"
                  style={{ height: `${pct}%` }}
                />
              ) : (
                <span className="h-[3px] w-full rounded-full bg-line-strong" />
              )}
            </span>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {MONTH_LETTER.map((letter, idx) => (
          <span
            key={idx}
            className={`flex-1 text-center font-mono text-[9px] ${
              idx === monthIndex ? "font-bold text-brand-600 dark:text-brand-400" : "text-ink-faint"
            }`}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}

function RowActionsToggle({
  row,
  parents,
  hasChildren,
}: {
  row: PlanMatrixRow;
  parents: Parent[];
  hasChildren: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={`${row.categoryName} options`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition hover:bg-surface-muted hover:text-ink ${focusRing}`}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
      {open ? (
        <div className="basis-full pb-1 pt-2">
          <CategoryRowActions
            categoryId={row.categoryId}
            categoryName={row.categoryName}
            archived={row.archived}
            parentId={row.parentId}
            parents={parents}
            hasChildren={hasChildren}
          />
        </div>
      ) : null}
    </>
  );
}

function MonthRow({
  row,
  label,
  year,
  monthIndex,
  currency,
  parents,
  hasChildren,
  nested = false,
}: {
  row: PlanMatrixRow;
  label?: string;
  year: number;
  monthIndex: number;
  currency: Currency;
  parents: Parent[];
  hasChildren: boolean;
  nested?: boolean;
}) {
  return (
    <li className={`flex flex-wrap items-center gap-2 py-3.5 ${nested ? "pl-6" : ""}`}>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-semibold ${nested ? "text-sm" : "text-[15px]"} ${
            row.archived ? "text-ink-faint line-through" : "text-ink"
          }`}
        >
          {label ?? row.categoryName}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
          actual <Money minor={row.actual[monthIndex]} currency={currency} />
        </p>
      </div>
      {row.archived ? (
        <span className="font-mono text-sm tabular-nums text-ink-faint">
          <Money minor={row.planned[monthIndex]} currency={currency} />
        </span>
      ) : (
        <PlanCellInput
          categoryId={row.categoryId}
          year={year}
          month={monthIndex + 1}
          valueMinor={row.plannedRaw[monthIndex]}
          ariaLabel={`${row.categoryName} plan for ${monthName(monthIndex + 1)}`}
          inputClassName="h-11 w-32 rounded-xl bg-surface-muted px-3 font-mono text-sm sm:w-40"
        />
      )}
      <RowActionsToggle row={row} parents={parents} hasChildren={hasChildren} />
    </li>
  );
}

function GroupHeader({
  group,
  expanded,
  onToggle,
  amount,
  sub,
  currency,
}: {
  group: PlanGroup<PlanMatrixRow>;
  expanded: boolean;
  onToggle: () => void;
  amount: number | null;
  sub: ReactNode;
  currency: Currency;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className={`flex w-full items-center gap-2 rounded-lg py-3.5 text-left ${focusRing}`}
    >
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${expanded ? "" : "-rotate-90"}`}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[15px] font-semibold ${
            group.root.archived ? "text-ink-faint line-through" : "text-ink"
          }`}
        >
          {group.root.categoryName}
        </span>
        <span className="mt-0.5 block font-mono text-[11px] text-ink-faint">{sub}</span>
      </span>
      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
        <PlainMoney minor={amount} currency={currency} />
      </span>
    </button>
  );
}

export function PlanBoard({ year, currency, matrix }: { year: number; currency: Currency; matrix: PlanMatrix }) {
  const now = useMemo(() => new Date(), []);
  const defaultMonth = year === now.getFullYear() ? now.getMonth() : 0;

  const [tab, setTab] = useState<Tab>("month");
  const [monthIndex, setMonthIndex] = useState(defaultMonth);
  const [monthYear, setMonthYear] = useState(year);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [adding, setAdding] = useState(false);
  const pillsRef = useRef<HTMLDivElement>(null);

  if (monthYear !== year) {
    setMonthYear(year);
    setMonthIndex(defaultMonth);
  }

  useEffect(() => {
    const strip = pillsRef.current;
    const pill = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!strip || !pill) return;
    strip.scrollTo({ left: pill.offsetLeft - strip.clientWidth / 2 + pill.clientWidth / 2, behavior: "smooth" });
  }, [monthIndex, tab]);

  const groups = useMemo(() => groupPlanRows(matrix.rows), [matrix.rows]);
  const parents: Parent[] = useMemo(
    () =>
      groups
        .filter((g) => g.root.parentId === null && !g.root.archived)
        .map((g) => ({ id: g.root.categoryId, name: g.root.categoryName })),
    [groups]
  );

  const budget = matrix.columnTotals[monthIndex];
  const spent = sumNullable(matrix.rows.map((row) => row.actual[monthIndex]));
  const maxMonthTotal = maxOf(matrix.columnTotals);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
    { key: "totals", label: "Totals" },
  ];

  const circleBtn = `flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-card text-ink transition hover:border-ink-muted ${focusRing}`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Link href={`/plan?year=${year - 1}`} aria-label="Previous year" className={circleBtn}>
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </Link>
        <h1 className="min-w-0 flex-1 text-center text-[15px] font-semibold text-ink">Plan {year}</h1>
        <Link href={`/plan?year=${year + 1}`} aria-label="Next year" className={circleBtn}>
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </Link>
      </div>

      <section className="card !rounded-[20px] !p-0">
        <div className="space-y-4 border-b border-line p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                {MONTH_ABBR[monthIndex]} budget
              </p>
              <p className="mt-1 truncate font-mono text-[28px] font-bold leading-tight tabular-nums text-ink sm:text-[34px]">
                <Money minor={budget} currency={currency} />
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Spent</p>
              <p className="mt-1 font-mono text-sm tabular-nums text-brand-600 dark:text-brand-400 sm:text-base">
                <Money minor={spent} currency={currency} />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1" role="group" aria-label="Plan view">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${focusRing} ${
                  tab === t.key
                    ? "border-line-strong bg-surface-muted text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab !== "totals" ? (
            <div
              ref={pillsRef}
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6"
              role="group"
              aria-label="Month"
            >
              {MONTH_ABBR.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={idx === monthIndex}
                  onClick={() => setMonthIndex(idx)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${focusRing} ${
                    idx === monthIndex
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line bg-surface-muted text-ink-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-4 sm:p-6">
          {tab === "month" ? (
            <>
              {groups.length === 0 ? (
                <p className="rounded-xl bg-surface-muted px-3 py-4 text-sm text-ink-faint">No categories yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {groups.map((group) => {
                    if (group.children.length === 0) {
                      return (
                        <MonthRow
                          key={group.root.categoryId}
                          row={group.root}
                          year={year}
                          monthIndex={monthIndex}
                          currency={currency}
                          parents={parents}
                          hasChildren={false}
                        />
                      );
                    }
                    const open = expanded.has(group.root.categoryId);
                    return (
                      <li key={group.root.categoryId}>
                        <GroupHeader
                          group={group}
                          expanded={open}
                          onToggle={() => toggle(group.root.categoryId)}
                          amount={group.planned[monthIndex]}
                          currency={currency}
                          sub={
                            <>
                              {group.children.length} sub · actual{" "}
                              <PlainMoney minor={group.actual[monthIndex]} currency={currency} />
                            </>
                          }
                        />
                        {open ? (
                          <ul className="mb-2 divide-y divide-line border-l-2 border-line-strong">
                            <MonthRow
                              row={group.root}
                              label="General"
                              year={year}
                              monthIndex={monthIndex}
                              currency={currency}
                              parents={parents}
                              hasChildren
                              nested
                            />
                            {group.children.map((child) => (
                              <MonthRow
                                key={child.categoryId}
                                row={child}
                                year={year}
                                monthIndex={monthIndex}
                                currency={currency}
                                parents={parents}
                                hasChildren={false}
                                nested
                              />
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-4">
                {adding ? (
                  <div className="rounded-xl border border-line p-3">
                    <AddCategoryForm parents={parents} />
                    <button type="button" onClick={() => setAdding(false)} className="text-action mt-2 text-xs">
                      Close
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3.5 text-sm font-semibold text-ink-muted transition hover:text-ink ${focusRing}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    New category
                  </button>
                )}
              </div>
            </>
          ) : null}

          {tab === "year" ? (
            groups.length === 0 ? (
              <p className="rounded-xl bg-surface-muted px-3 py-4 text-sm text-ink-faint">No categories yet.</p>
            ) : (
              <ul className="grid gap-x-8 lg:grid-cols-2">
                {groups.map((group) => {
                  const hasChildren = group.children.length > 0;
                  const open = hasChildren && expanded.has(group.root.categoryId);
                  return (
                    <li key={group.root.categoryId} className="border-b border-line py-4">
                      {hasChildren ? (
                        <GroupHeader
                          group={group}
                          expanded={open}
                          onToggle={() => toggle(group.root.categoryId)}
                          amount={group.total}
                          currency={currency}
                          sub={`${group.children.length} sub`}
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-3 pb-3">
                          <span
                            className={`truncate text-[15px] font-semibold ${
                              group.root.archived ? "text-ink-faint line-through" : "text-ink"
                            }`}
                          >
                            {group.root.categoryName}
                          </span>
                          <span className="shrink-0 font-mono text-sm tabular-nums text-ink">
                            <Money minor={group.total} currency={currency} />
                          </span>
                        </div>
                      )}
                      <YearBars
                        values={group.planned}
                        monthIndex={monthIndex}
                        currency={currency}
                        label={group.root.categoryName}
                      />
                      {open ? (
                        <ul className="mt-3 space-y-4 border-l-2 border-line-strong pl-4">
                          {[{ row: group.root, label: "General" }, ...group.children.map((row) => ({ row, label: row.categoryName }))].map(
                            ({ row, label }) => (
                              <li key={row.categoryId}>
                                <div className="flex items-center justify-between gap-3 pb-2">
                                  <span className="truncate text-sm font-semibold text-ink">{label}</span>
                                  <span className="shrink-0 font-mono text-xs tabular-nums text-ink-muted">
                                    <Money minor={row.rowTotal} currency={currency} />
                                  </span>
                                </div>
                                <YearBars
                                  values={row.planned}
                                  monthIndex={monthIndex}
                                  currency={currency}
                                  label={row.categoryName}
                                />
                              </li>
                            )
                          )}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )
          ) : null}

          {tab === "totals" ? (
            <div className="space-y-4">
              <ul className="space-y-1">
                {matrix.columnTotals.map((total, idx) => {
                  const pct = total && maxMonthTotal > 0 ? Math.round((total / maxMonthTotal) * 100) : 0;
                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        aria-pressed={idx === monthIndex}
                        onClick={() => setMonthIndex(idx)}
                        className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition ${focusRing} ${
                          idx === monthIndex ? "bg-surface-muted" : "hover:bg-surface-muted"
                        }`}
                      >
                        <span className="w-9 shrink-0 text-sm font-semibold text-ink">{MONTH_ABBR[idx]}</span>
                        <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
                          <span
                            className="block h-full rounded-full bg-brand-700 dark:bg-brand-600"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="w-32 shrink-0 text-right font-mono text-sm tabular-nums text-ink sm:w-40">
                          <PlainMoney minor={total} currency={currency} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-muted px-5 py-5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Year total</span>
                <span className="font-mono text-xl font-bold tabular-nums text-ink">
                  <Money minor={matrix.grandTotal} currency={currency} />
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
