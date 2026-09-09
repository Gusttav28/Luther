import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency, type Rates } from "@/lib/money";
import { periodDateRange, type HalfPeriod, type PeriodRef } from "@/lib/periods";
import {
  computeWaterfall,
  plannedSalaryTakeMinor,
  type PeriodMode,
  type WaterfallResult,
} from "@/lib/waterfall";

export interface ScopeAmounts {
  receivedIncomeMinor: number | null;
  plannedSalaryMinor: number | null;
  chargedExpensesMinor: number | null;
  planningExpensesMinor: number | null;
}

function incomePeriods(period: HalfPeriod | "BOTH"): HalfPeriod[] {
  return period === "BOTH" ? ["H1", "H2"] : [period];
}

function expenseDateFilter(
  year: number,
  month: number,
  period: HalfPeriod | "BOTH"
): { gte: Date; lt?: Date; lte?: Date } {
  if (period === "BOTH") {
    return { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
  }
  const { start, end } = periodDateRange({ year, month, period });
  return { gte: start, lte: end };
}

/** Received income only (`planned === false`). No planned-first fallback. */
export async function incomeForScope(
  userId: string,
  year: number,
  month: number,
  period: HalfPeriod | "BOTH",
  reporting: Currency,
  rates: Rates
): Promise<number | null> {
  const rows = await prisma.incomeEntry.findMany({
    where: {
      userId,
      year,
      month,
      planned: false,
      period: { in: incomePeriods(period) },
    },
  });
  return sumInCurrency(
    rows.map((r) => ({ amountMinor: r.amountMinor, currency: r.currency as Currency })),
    reporting,
    rates
  );
}

async function plannedSalaryForScope(
  userId: string,
  year: number,
  month: number,
  period: HalfPeriod | "BOTH",
  reporting: Currency,
  rates: Rates
): Promise<number | null> {
  const rows = await prisma.incomeEntry.findMany({
    where: {
      userId,
      year,
      month,
      planned: true,
      period: { in: incomePeriods(period) },
    },
  });
  return sumInCurrency(
    rows.map((r) => ({ amountMinor: r.amountMinor, currency: r.currency as Currency })),
    reporting,
    rates
  );
}

export async function expensesForScope(
  userId: string,
  year: number,
  month: number,
  period: HalfPeriod | "BOTH",
  reporting: Currency,
  rates: Rates
): Promise<number | null> {
  const date = expenseDateFilter(year, month, period);
  const rows = await prisma.expense.findMany({
    where: { userId, completed: true, date },
    select: { amountMinor: true, currency: true },
  });
  return sumInCurrency(
    rows.map((r) => ({ amountMinor: r.amountMinor, currency: r.currency as Currency })),
    reporting,
    rates
  );
}

async function planningExpensesForScope(
  userId: string,
  year: number,
  month: number,
  period: HalfPeriod | "BOTH",
  reporting: Currency,
  rates: Rates
): Promise<number | null> {
  const date = expenseDateFilter(year, month, period);
  const rows = await prisma.expense.findMany({
    where: { userId, completed: false, date },
    select: { amountMinor: true, currency: true },
  });
  return sumInCurrency(
    rows.map((r) => ({ amountMinor: r.amountMinor, currency: r.currency as Currency })),
    reporting,
    rates
  );
}

export async function getScopeAmounts(
  userId: string,
  year: number,
  month: number,
  period: HalfPeriod | "BOTH",
  reporting: Currency,
  rates: Rates
): Promise<ScopeAmounts> {
  const [receivedIncomeMinor, plannedSalaryMinor, chargedExpensesMinor, planningExpensesMinor] =
    await Promise.all([
      incomeForScope(userId, year, month, period, reporting, rates),
      plannedSalaryForScope(userId, year, month, period, reporting, rates),
      expensesForScope(userId, year, month, period, reporting, rates),
      planningExpensesForScope(userId, year, month, period, reporting, rates),
    ]);
  return {
    receivedIncomeMinor,
    plannedSalaryMinor,
    chargedExpensesMinor,
    planningExpensesMinor,
  };
}

export function waterfallFromScope(
  scope: ScopeAmounts,
  projectAllocationPercent?: number
): WaterfallResult | null {
  if (
    scope.receivedIncomeMinor === null ||
    scope.chargedExpensesMinor === null ||
    scope.planningExpensesMinor === null
  ) {
    return null;
  }
  return computeWaterfall({
    receivedIncomeMinor: scope.receivedIncomeMinor,
    chargedExpensesMinor: scope.chargedExpensesMinor,
    planningExpensesMinor: scope.planningExpensesMinor,
    projectAllocationPercent,
  });
}

export function plannedTakeFromScope(scope: ScopeAmounts): number | null {
  if (
    scope.receivedIncomeMinor === null ||
    scope.plannedSalaryMinor === null ||
    scope.chargedExpensesMinor === null ||
    scope.planningExpensesMinor === null
  ) {
    return null;
  }
  return plannedSalaryTakeMinor({
    receivedIncomeMinor: scope.receivedIncomeMinor,
    plannedSalaryMinor: scope.plannedSalaryMinor,
    chargedExpensesMinor: scope.chargedExpensesMinor,
    planningExpensesMinor: scope.planningExpensesMinor,
  });
}

function midDate(ref: PeriodRef): Date {
  if (ref.period === "H1") return new Date(ref.year, ref.month - 1, 8);
  return new Date(ref.year, ref.month - 1, 22);
}

function projectAppliesToPeriod(mode: PeriodMode, period: HalfPeriod): boolean {
  return mode === "BOTH" || mode === period;
}

type PriorityProject = {
  id: string;
  allocationPercent: number;
  periodMode: string;
};

/**
 * Idempotently materialize waterfall lifetime take + priority project take for a half.
 */
export async function materializeHalfWaterfall(
  userId: string,
  ref: PeriodRef,
  reporting: Currency,
  rates: Rates,
  priority?: PriorityProject | null
): Promise<void> {
  const [scope, resolvedPriority] = await Promise.all([
    getScopeAmounts(userId, ref.year, ref.month, ref.period, reporting, rates),
    priority !== undefined
      ? Promise.resolve(priority)
      : prisma.project.findFirst({
          where: { userId, isPriority: true, completedAt: null },
          select: { id: true, allocationPercent: true, periodMode: true },
        }),
  ]);

  const waterfall = waterfallFromScope(scope, resolvedPriority?.allocationPercent);
  if (!waterfall) return;

  const date = midDate(ref);

  const writes: Promise<unknown>[] = [
    prisma.savingsContribution.upsert({
      where: {
        userId_year_month_period_source: {
          userId,
          year: ref.year,
          month: ref.month,
          period: ref.period,
          source: "waterfall",
        },
      },
      create: {
        userId,
        date,
        amountMinor: waterfall.lifetimeTakeMinor,
        currency: reporting,
        note: "Lifetime savings (70% of leftover after received salary and reserved bills)",
        source: "waterfall",
        year: ref.year,
        month: ref.month,
        period: ref.period,
      },
      update: {
        amountMinor: waterfall.lifetimeTakeMinor,
        currency: reporting,
        date,
      },
    }),
  ];

  if (
    resolvedPriority &&
    projectAppliesToPeriod(resolvedPriority.periodMode as PeriodMode, ref.period) &&
    waterfall.projectTakeMinor > 0
  ) {
    writes.push(
      prisma.projectContribution.upsert({
        where: {
          userId_projectId_year_month_period_source: {
            userId,
            projectId: resolvedPriority.id,
            year: ref.year,
            month: ref.month,
            period: ref.period,
            source: "waterfall",
          },
        },
        create: {
          userId,
          projectId: resolvedPriority.id,
          year: ref.year,
          month: ref.month,
          period: ref.period,
          amountMinor: waterfall.projectTakeMinor,
          currency: reporting,
          source: "waterfall",
        },
        update: {
          amountMinor: waterfall.projectTakeMinor,
          currency: reporting,
        },
      })
    );
  }

  await Promise.all(writes);
}

/** Skip re-materializing the same month within a short window (login warm → home). */
const recentMaterialize = new Map<string, number>();
const MATERIALIZE_DEDUPE_MS = 45_000;

/** Materialize H1 and H2 for a calendar month (in parallel). */
export async function materializeMonthWaterfall(
  userId: string,
  year: number,
  month: number,
  reporting: Currency,
  rates: Rates
): Promise<void> {
  const key = `${userId}:${year}:${month}`;
  const last = recentMaterialize.get(key);
  if (last && Date.now() - last < MATERIALIZE_DEDUPE_MS) return;

  const owner = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!owner) return;

  const priority = await prisma.project.findFirst({
    where: { userId, isPriority: true, completedAt: null },
    select: { id: true, allocationPercent: true, periodMode: true },
  });

  await Promise.all([
    materializeHalfWaterfall(userId, { year, month, period: "H1" }, reporting, rates, priority),
    materializeHalfWaterfall(userId, { year, month, period: "H2" }, reporting, rates, priority),
  ]);

  recentMaterialize.set(key, Date.now());
}
