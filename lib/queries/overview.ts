import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency, type Rates } from "@/lib/money";
import type { HalfPeriod } from "@/lib/periods";

export interface OverviewFigures {
  /** All figures in the reporting currency; null when a needed rate is unset. */
  earned: number | null;
  spent: number | null;
  saved: number | null;
  remaining: number | null;
  perPeriod: Record<
    HalfPeriod,
    { earned: number | null; spent: number | null; saved: number | null }
  >;
  lifetimeSavingsBalance: number | null;
}

function sub(...values: (number | null)[]): number | null {
  let acc: number | null = null;
  for (const [i, v] of values.entries()) {
    if (v === null) return null;
    acc = i === 0 ? v : (acc as number) - v;
  }
  return acc;
}

export async function getOverview(
  userId: string,
  year: number,
  month: number,
  reporting: Currency,
  rates: Rates
): Promise<OverviewFigures> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const h2Start = new Date(year, month - 1, 16);

  const [income, expenses, savingsMonth, savingsAll] = await Promise.all([
    prisma.incomeEntry.findMany({ where: { userId, year, month, planned: false } }),
    prisma.expense.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      select: { amountMinor: true, currency: true, date: true },
    }),
    prisma.savingsContribution.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      select: { amountMinor: true, currency: true, date: true },
    }),
    prisma.savingsContribution.findMany({
      where: { userId },
      select: { amountMinor: true, currency: true },
    }),
  ]);

  const toReporting = (list: Array<{ amountMinor: number; currency: string }>) =>
    sumInCurrency(
      list.map((r) => ({ amountMinor: r.amountMinor, currency: r.currency as Currency })),
      reporting,
      rates
    );

  const earned = toReporting(income);
  const spent = toReporting(expenses);
  const saved = toReporting(savingsMonth);
  const remaining = sub(earned, spent, saved);

  const perPeriod: OverviewFigures["perPeriod"] = {
    H1: {
      earned: toReporting(income.filter((i) => i.period === "H1")),
      spent: toReporting(expenses.filter((e) => e.date < h2Start)),
      saved: toReporting(savingsMonth.filter((s) => s.date < h2Start)),
    },
    H2: {
      earned: toReporting(income.filter((i) => i.period === "H2")),
      spent: toReporting(expenses.filter((e) => e.date >= h2Start)),
      saved: toReporting(savingsMonth.filter((s) => s.date >= h2Start)),
    },
  };

  return {
    earned,
    spent,
    saved,
    remaining,
    perPeriod,
    lifetimeSavingsBalance: toReporting(savingsAll),
  };
}
