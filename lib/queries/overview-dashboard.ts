import { sumInCurrency, type Currency, type Rates } from "@/lib/money";
import type { OverviewFigures, MonthSnapshot } from "@/lib/queries/overview";
import {
  figuresFromSnapshot,
  getLifetimeSavingsBalance,
  loadMonthSnapshot,
} from "@/lib/queries/overview";
import { getScopeAmounts } from "@/lib/queries/waterfall-scope";
import { getProjectsView, type ProjectsView } from "@/lib/queries/projects";

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

/** Derive category spend from an already-loaded month snapshot (no extra DB). */
export function spentByCategoryFromSnapshot(
  snapshot: MonthSnapshot,
  reporting: Currency,
  rates: Rates
): SpentByCategoryResult {
  const byCategory = new Map<
    string,
    { name: string; rows: Array<{ amountMinor: number; currency: Currency }> }
  >();
  for (const expense of snapshot.expenses) {
    const existing = byCategory.get(expense.categoryId);
    const row = { amountMinor: expense.amountMinor, currency: expense.currency };
    if (existing) existing.rows.push(row);
    else byCategory.set(expense.categoryId, { name: expense.categoryName, rows: [row] });
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

/** Derive cashflow series from an already-loaded month snapshot (no extra DB). */
export function cashflowFromSnapshot(
  snapshot: MonthSnapshot,
  reporting: Currency,
  rates: Rates
): CashflowPoint[] {
  const lastDay = new Date(snapshot.year, snapshot.month, 0).getDate();
  const h1End = 15;

  const toReporting = (list: Array<{ amountMinor: number; currency: string }>) =>
    sumInCurrency(
      list.map((r) => ({ amountMinor: r.amountMinor, currency: r.currency as Currency })),
      reporting,
      rates
    );

  const earnedH1 = toReporting(snapshot.income.filter((i) => i.period === "H1"));
  const earnedH2 = toReporting(snapshot.income.filter((i) => i.period === "H2"));
  const earnedMonth =
    earnedH1 === null || earnedH2 === null ? null : earnedH1 + earnedH2;

  const spentH1 = toReporting(
    snapshot.expenses
      .filter((e) => e.date.getDate() <= h1End)
      .map((e) => ({ amountMinor: e.amountMinor, currency: e.currency }))
  );
  const spentMonth = toReporting(
    snapshot.expenses.map((e) => ({ amountMinor: e.amountMinor, currency: e.currency }))
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

export interface OverviewDashboard {
  overview: OverviewFigures;
  priorOverview: OverviewFigures;
  spentByCategory: SpentByCategoryResult;
  cashflow: CashflowPoint[];
  projectsView: ProjectsView;
}

/**
 * Single Overview page load: shared month snapshots, one lifetime aggregate,
 * derived charts — no page-read materialize (R1, R3).
 */
export async function getOverviewDashboard(
  userId: string,
  year: number,
  month: number,
  reporting: Currency,
  rates: Rates
): Promise<OverviewDashboard> {
  const prior = priorMonth(year, month);

  const [
    currentSnap,
    priorSnap,
    lifetimeSavingsBalance,
    currentMonthScope,
    currentH1Scope,
    currentH2Scope,
    priorMonthScope,
    priorH1Scope,
    priorH2Scope,
    projectsView,
  ] = await Promise.all([
    loadMonthSnapshot(userId, year, month),
    loadMonthSnapshot(userId, prior.year, prior.month),
    getLifetimeSavingsBalance(userId, reporting, rates),
    getScopeAmounts(userId, year, month, "BOTH", reporting, rates),
    getScopeAmounts(userId, year, month, "H1", reporting, rates),
    getScopeAmounts(userId, year, month, "H2", reporting, rates),
    getScopeAmounts(userId, prior.year, prior.month, "BOTH", reporting, rates),
    getScopeAmounts(userId, prior.year, prior.month, "H1", reporting, rates),
    getScopeAmounts(userId, prior.year, prior.month, "H2", reporting, rates),
    getProjectsView(userId, rates, new Date(), { skipMaterialize: true }),
  ]);

  const overview = figuresFromSnapshot(
    currentSnap,
    { month: currentMonthScope, h1: currentH1Scope, h2: currentH2Scope },
    lifetimeSavingsBalance,
    reporting,
    rates
  );
  const priorOverview = figuresFromSnapshot(
    priorSnap,
    { month: priorMonthScope, h1: priorH1Scope, h2: priorH2Scope },
    lifetimeSavingsBalance,
    reporting,
    rates
  );

  return {
    overview,
    priorOverview,
    spentByCategory: spentByCategoryFromSnapshot(currentSnap, reporting, rates),
    cashflow: cashflowFromSnapshot(currentSnap, reporting, rates),
    projectsView,
  };
}
