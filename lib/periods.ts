/**
 * Half-month period helpers (R3, R7, R8, R9).
 * H1 = days 1–15; H2 = day 16 through the end of the month.
 */

export const PERIODS = ["H1", "H2"] as const;
export type HalfPeriod = (typeof PERIODS)[number];

export interface PeriodRef {
  year: number;
  month: number; // 1-12
  period: HalfPeriod;
}

/** The half-month period containing a date (local components of the Date). */
export function periodOfDate(date: Date): PeriodRef {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    period: date.getDate() <= 15 ? "H1" : "H2",
  };
}

/** Sortable integer index for a period (…, 2026-01 H1, 2026-01 H2, 2026-02 H1, …). */
export function periodIndex(ref: PeriodRef): number {
  return ref.year * 24 + (ref.month - 1) * 2 + (ref.period === "H1" ? 0 : 1);
}

export function comparePeriods(a: PeriodRef, b: PeriodRef): number {
  return periodIndex(a) - periodIndex(b);
}

export function nextPeriod(ref: PeriodRef): PeriodRef {
  if (ref.period === "H1") return { ...ref, period: "H2" };
  const month = ref.month === 12 ? 1 : ref.month + 1;
  const year = ref.month === 12 ? ref.year + 1 : ref.year;
  return { year, month, period: "H1" };
}

export function addPeriods(ref: PeriodRef, count: number): PeriodRef {
  let current = ref;
  for (let i = 0; i < count; i++) current = nextPeriod(current);
  return current;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

/** Human label, e.g. "Jan 1–15, 2026" / "Jan 16–31, 2026". */
export function periodLabel(ref: PeriodRef): string {
  const name = monthName(ref.month).slice(0, 3);
  if (ref.period === "H1") return `${name} 1–15, ${ref.year}`;
  const lastDay = new Date(ref.year, ref.month, 0).getDate();
  return `${name} 16–${lastDay}, ${ref.year}`;
}

/** Date range covered by a period: [start, end] inclusive, local time. */
export function periodDateRange(ref: PeriodRef): { start: Date; end: Date } {
  if (ref.period === "H1") {
    return {
      start: new Date(ref.year, ref.month - 1, 1),
      end: new Date(ref.year, ref.month - 1, 15, 23, 59, 59, 999),
    };
  }
  const lastDay = new Date(ref.year, ref.month, 0).getDate();
  return {
    start: new Date(ref.year, ref.month - 1, 16),
    end: new Date(ref.year, ref.month - 1, lastDay, 23, 59, 59, 999),
  };
}

/** The current period for "today". */
export function currentPeriod(now: Date = new Date()): PeriodRef {
  return periodOfDate(now);
}
