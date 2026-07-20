import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency, type Rates } from "@/lib/money";
import type { OverviewFigures } from "@/lib/queries/overview";

export interface MomDelta {
  /** Percent change vs prior month; null when not computable. */
  percent: number | null;
  /** Absolute change (current − prior); null when either side missing. */
  absolute: number | null;
}

export type MomDeltas = Partial<
  Record<"earned" | "spent" | "saved" | "remaining", MomDelta>
>;

export function priorMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function momDelta(current: number | null, prior: number | null): MomDelta {
  if (current === null || prior === null) {
    return { percent: null, absolute: null };
  }
  const absolute = current - prior;
  if (prior === 0) {
    return { percent: null, absolute };
  }
  const percent = (absolute / Math.abs(prior)) * 100;
  return { percent, absolute };
}

/** MoM deltas for the four monthly KPIs (lifetime omitted per design). */
export function computeMomDeltas(current: OverviewFigures, prior: OverviewFigures): MomDeltas {
  return {
    earned: momDelta(current.earned, prior.earned),
    spent: momDelta(current.spent, prior.spent),
    saved: momDelta(current.saved, prior.saved),
    remaining: momDelta(current.remaining, prior.remaining),
  };
}

export interface CategorySpend {
  categoryId: string;
  name: string;
  amountMinor: number | null;
  share: number | null;
}

export interface SpentByCategoryResult {
  totalMinor: number | null;
  categories: CategorySpend[];
}

/** Aggregate expense totals by category for a month (reporting currency). */
export async function getSpentByCategory(
  userId: string,
  year: number,
  month: number,
  reporting: Currency,
  rates: Rates
): Promise<SpentByCategoryResult> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: monthStart, lt: monthEnd } },
    include: { category: true },
  });

  const byCategory = new Map<string, { name: string; rows: Array<{ amountMinor: number; currency: Currency }> }>();
  for (const expense of expenses) {
    const key = expense.categoryId;
    const existing = byCategory.get(key);
    const row = {
      amountMinor: expense.amountMinor,
      currency: expense.currency as Currency,
    };
    if (existing) {
      existing.rows.push(row);
    } else {
      byCategory.set(key, { name: expense.category.name, rows: [row] });
    }
  }

  const categories: CategorySpend[] = [];
  let totalMinor: number | null = 0;

  for (const [categoryId, { name, rows }] of byCategory) {
    const amountMinor = sumInCurrency(rows, reporting, rates);
    if (amountMinor === null) totalMinor = null;
    else if (totalMinor !== null) totalMinor += amountMinor;
    categories.push({ categoryId, name, amountMinor, share: null });
  }

  categories.sort((a, b) => (b.amountMinor ?? 0) - (a.amountMinor ?? 0));

  if (totalMinor !== null && totalMinor > 0) {
    for (const cat of categories) {
      cat.share = cat.amountMinor === null ? null : cat.amountMinor / totalMinor;
    }
  }

  return { totalMinor, categories };
}

export interface CashflowPoint {
  label: string;
  /** Day of month this point represents (1, 15, or last day). */
  day: number;
  cumulativeEarned: number | null;
  cumulativeSpent: number | null;
  cumulativeNet: number | null;
}

/**
 * Cashflow series for the selected month: start, end of H1, end of month.
 * Values are cumulative earned / spent / net in reporting currency.
 */
export async function getCashflowSeries(
  userId: string,
  year: number,
  month: number,
  reporting: Currency,
  rates: Rates
): Promise<CashflowPoint[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const h1End = 15;

  const [income, expenses] = await Promise.all([
    prisma.incomeEntry.findMany({
      where: { userId, year, month, planned: false },
      select: { amountMinor: true, currency: true, period: true },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      select: { amountMinor: true, currency: true, date: true },
    }),
  ]);

  const toReporting = (list: Array<{ amountMinor: number; currency: string }>) =>
    sumInCurrency(
      list.map((r) => ({ amountMinor: r.amountMinor, currency: r.currency as Currency })),
      reporting,
      rates
    );

  const earnedH1 = toReporting(income.filter((i) => i.period === "H1"));
  const earnedH2 = toReporting(income.filter((i) => i.period === "H2"));
  const earnedMonth =
    earnedH1 === null || earnedH2 === null ? null : earnedH1 + earnedH2;

  const spentH1 = toReporting(
    expenses.filter((e) => e.date.getDate() <= h1End).map((e) => ({
      amountMinor: e.amountMinor,
      currency: e.currency,
    }))
  );
  const spentMonth = toReporting(
    expenses.map((e) => ({ amountMinor: e.amountMinor, currency: e.currency }))
  );

  const net = (earned: number | null, spent: number | null): number | null => {
    if (earned === null || spent === null) return null;
    return earned - spent;
  };

  return [
    {
      label: "Start",
      day: 1,
      cumulativeEarned: 0,
      cumulativeSpent: 0,
      cumulativeNet: 0,
    },
    {
      label: "H1",
      day: h1End,
      cumulativeEarned: earnedH1,
      cumulativeSpent: spentH1,
      cumulativeNet: net(earnedH1, spentH1),
    },
    {
      label: "End",
      day: lastDay,
      cumulativeEarned: earnedMonth,
      cumulativeSpent: spentMonth,
      cumulativeNet: net(earnedMonth, spentMonth),
    },
  ];
}
