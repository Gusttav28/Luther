import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency, type Rates } from "@/lib/money";
import type { HalfPeriod } from "@/lib/periods";
import { computeWaterfall } from "@/lib/waterfall";
import { getScopeAmounts, materializeMonthWaterfall } from "@/lib/queries/waterfall-scope";

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
  leftoverMinor: number | null;
  postLifetimeMinor: number | null;
}

export interface MonthExpenseRow {
  amountMinor: number;
  currency: Currency;
  date: Date;
  categoryId: string;
  categoryName: string;
}

export interface MonthIncomeRow {
  amountMinor: number;
  currency: Currency;
  period: string;
}

export interface MonthSnapshot {
  year: number;
  month: number;
  income: MonthIncomeRow[];
  expenses: MonthExpenseRow[];
  savingsMonth: Array<{ amountMinor: number; currency: Currency; date: Date; source: string }>;
}

function sub(...values: (number | null)[]): number | null {
  let acc: number | null = null;
  for (const [i, v] of values.entries()) {
    if (v === null) return null;
    acc = i === 0 ? v : (acc as number) - v;
  }
  return acc;
}

function toReporting(
  list: Array<{ amountMinor: number; currency: string }>,
  reporting: Currency,
  rates: Rates
): number | null {
  return sumInCurrency(
    list.map((r) => ({ amountMinor: r.amountMinor, currency: r.currency as Currency })),
    reporting,
    rates
  );
}

/** Lifetime savings balance via per-currency aggregate (not full row hydration). */
export async function getLifetimeSavingsBalance(
  userId: string,
  reporting: Currency,
  rates: Rates
): Promise<number | null> {
  const grouped = await prisma.savingsContribution.groupBy({
    by: ["currency"],
    where: { userId },
    _sum: { amountMinor: true },
  });
  return toReporting(
    grouped.map((g) => ({
      amountMinor: g._sum.amountMinor ?? 0,
      currency: g.currency,
    })),
    reporting,
    rates
  );
}

export async function loadMonthSnapshot(
  userId: string,
  year: number,
  month: number
): Promise<MonthSnapshot> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const [income, expenses, savingsMonth] = await Promise.all([
    prisma.incomeEntry.findMany({
      where: { userId, year, month, planned: false },
      select: { amountMinor: true, currency: true, period: true },
    }),
    prisma.expense.findMany({
      where: { userId, completed: true, date: { gte: monthStart, lt: monthEnd } },
      select: {
        amountMinor: true,
        currency: true,
        date: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    }),
    prisma.savingsContribution.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      select: { amountMinor: true, currency: true, date: true, source: true },
    }),
  ]);

  return {
    year,
    month,
    income: income.map((i) => ({
      amountMinor: i.amountMinor,
      currency: i.currency as Currency,
      period: i.period,
    })),
    expenses: expenses.map((e) => ({
      amountMinor: e.amountMinor,
      currency: e.currency as Currency,
      date: e.date,
      categoryId: e.categoryId,
      categoryName: e.category.name,
    })),
    savingsMonth: savingsMonth.map((s) => ({
      amountMinor: s.amountMinor,
      currency: s.currency as Currency,
      date: s.date,
      source: s.source,
    })),
  };
}

export function figuresFromSnapshot(
  snapshot: MonthSnapshot,
  scopes: {
    month: Awaited<ReturnType<typeof getScopeAmounts>>;
    h1: Awaited<ReturnType<typeof getScopeAmounts>>;
    h2: Awaited<ReturnType<typeof getScopeAmounts>>;
  },
  lifetimeSavingsBalance: number | null,
  reporting: Currency,
  rates: Rates
): OverviewFigures {
  const h2Start = new Date(snapshot.year, snapshot.month - 1, 16);
  const { income, expenses, savingsMonth } = snapshot;

  const earned = toReporting(income, reporting, rates);
  const spent = toReporting(expenses, reporting, rates);
  const saved = toReporting(
    savingsMonth.filter((s) => s.amountMinor > 0),
    reporting,
    rates
  );
  const remaining = sub(earned, spent, saved);

  const monthWf =
    scopes.month.plannedIncomeMinor !== null && scopes.month.expensesMinor !== null
      ? computeWaterfall({
          plannedIncomeMinor: scopes.month.plannedIncomeMinor,
          expensesMinor: scopes.month.expensesMinor,
        })
      : null;

  const h1Wf =
    scopes.h1.plannedIncomeMinor !== null && scopes.h1.expensesMinor !== null
      ? computeWaterfall({
          plannedIncomeMinor: scopes.h1.plannedIncomeMinor,
          expensesMinor: scopes.h1.expensesMinor,
        })
      : null;
  const h2Wf =
    scopes.h2.plannedIncomeMinor !== null && scopes.h2.expensesMinor !== null
      ? computeWaterfall({
          plannedIncomeMinor: scopes.h2.plannedIncomeMinor,
          expensesMinor: scopes.h2.expensesMinor,
        })
      : null;

  const perPeriod: OverviewFigures["perPeriod"] = {
    H1: {
      earned: toReporting(
        income.filter((i) => i.period === "H1"),
        reporting,
        rates
      ),
      spent: toReporting(
        expenses.filter((e) => e.date < h2Start),
        reporting,
        rates
      ),
      saved:
        h1Wf?.lifetimeTakeMinor ??
        toReporting(
          savingsMonth.filter((s) => s.date < h2Start),
          reporting,
          rates
        ),
    },
    H2: {
      earned: toReporting(
        income.filter((i) => i.period === "H2"),
        reporting,
        rates
      ),
      spent: toReporting(
        expenses.filter((e) => e.date >= h2Start),
        reporting,
        rates
      ),
      saved:
        h2Wf?.lifetimeTakeMinor ??
        toReporting(
          savingsMonth.filter((s) => s.date >= h2Start),
          reporting,
          rates
        ),
    },
  };

  return {
    earned,
    spent,
    saved: monthWf?.lifetimeTakeMinor ?? saved,
    remaining:
      monthWf && earned !== null && spent !== null
        ? earned - spent - monthWf.lifetimeTakeMinor
        : remaining,
    perPeriod,
    lifetimeSavingsBalance,
    leftoverMinor: monthWf?.leftoverMinor ?? null,
    postLifetimeMinor: monthWf?.postLifetimeMinor ?? null,
  };
}

/**
 * Overview KPIs for a month. Does not materialize on read (R1).
 * Pass `{ materialize: true }` only from explicit refresh / sync paths.
 * Legacy `{ skipMaterialize: false }` also forces materialize.
 */
export async function getOverview(
  userId: string,
  year: number,
  month: number,
  reporting: Currency,
  rates: Rates,
  options?: { skipMaterialize?: boolean; materialize?: boolean }
): Promise<OverviewFigures> {
  if (options?.materialize === true || options?.skipMaterialize === false) {
    await materializeMonthWaterfall(userId, year, month, reporting, rates);
  }

  const [snapshot, lifetimeSavingsBalance, monthScope, h1Scope, h2Scope] = await Promise.all([
    loadMonthSnapshot(userId, year, month),
    getLifetimeSavingsBalance(userId, reporting, rates),
    getScopeAmounts(userId, year, month, "BOTH", reporting, rates),
    getScopeAmounts(userId, year, month, "H1", reporting, rates),
    getScopeAmounts(userId, year, month, "H2", reporting, rates),
  ]);

  return figuresFromSnapshot(
    snapshot,
    { month: monthScope, h1: h1Scope, h2: h2Scope },
    lifetimeSavingsBalance,
    reporting,
    rates
  );
}
