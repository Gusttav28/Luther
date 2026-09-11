import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency } from "@/lib/money";
import { monthName } from "@/lib/periods";
import {
  expensesForScope,
  getScopeAmounts,
  waterfallFromScope,
} from "@/lib/queries/waterfall-scope";
import type { AppSettings } from "@/lib/queries/settings";

export interface MonthSpendSaveRow {
  year: number;
  month: number;
  label: string;
  spentMinor: number | null;
  savedMinor: number | null;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Balance / Overview Savings headline is the leftover take, never opening + lifetime. */
export function savingsCardHeadline(monthTakeMinor: number | null): number | null {
  return monthTakeMinor;
}

function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

/**
 * Merge spent and saved by calendar month. Current month Saved is the live leftover
 * take. Newest first. A month is listed if spent or saved is non-zero, or a cell is null.
 */
export function composeMonthSpendSaveRows(input: {
  spentByKey: Record<string, number | null>;
  savedByKey: Record<string, number | null>;
  currentYear: number;
  currentMonth: number;
  currentTake: number | null;
}): MonthSpendSaveRow[] {
  const keys = new Set([
    ...Object.keys(input.spentByKey),
    ...Object.keys(input.savedByKey),
    monthKey(input.currentYear, input.currentMonth),
  ]);

  const rows: MonthSpendSaveRow[] = [];
  for (const key of keys) {
    const { year, month } = parseMonthKey(key);
    const isCurrent = year === input.currentYear && month === input.currentMonth;
    const spentMinor = Object.hasOwn(input.spentByKey, key)
      ? input.spentByKey[key]
      : isCurrent
        ? 0
        : undefined;
    const savedMinor = isCurrent
      ? input.currentTake
      : Object.hasOwn(input.savedByKey, key)
        ? input.savedByKey[key]
        : 0;

    const spentListed = spentMinor === null || (spentMinor !== undefined && spentMinor !== 0);
    const savedListed = savedMinor === null || savedMinor !== 0;
    if (!isCurrent && !spentListed && !savedListed) continue;

    rows.push({
      year,
      month,
      label: `${monthName(month)} ${year}`,
      spentMinor: spentMinor === undefined ? 0 : spentMinor,
      savedMinor,
    });
  }

  rows.sort((a, b) => b.year - a.year || b.month - a.month);
  return rows;
}

function groupSum(
  groups: Map<string, Array<{ amountMinor: number; currency: Currency }>>,
  reporting: Currency,
  rates: AppSettings["rates"]
): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const [key, amounts] of groups) {
    out[key] = sumInCurrency(amounts, reporting, rates);
  }
  return out;
}

export async function getBalanceMonthRows(
  userId: string,
  settings: AppSettings,
  now: Date = new Date()
): Promise<MonthSpendSaveRow[]> {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const { reportingCurrency: reporting, rates } = settings;

  const [expenses, waterfall, scope, currentSpent] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, completed: true },
      select: { amountMinor: true, currency: true, date: true },
    }),
    prisma.savingsContribution.findMany({
      where: { userId, source: "waterfall" },
      select: { amountMinor: true, currency: true, year: true, month: true, date: true },
    }),
    getScopeAmounts(userId, currentYear, currentMonth, "BOTH", reporting, rates),
    expensesForScope(userId, currentYear, currentMonth, "BOTH", reporting, rates),
  ]);

  const spentGroups = new Map<string, Array<{ amountMinor: number; currency: Currency }>>();
  for (const expense of expenses) {
    const key = monthKey(expense.date.getFullYear(), expense.date.getMonth() + 1);
    const list = spentGroups.get(key) ?? [];
    list.push({
      amountMinor: expense.amountMinor,
      currency: expense.currency as Currency,
    });
    spentGroups.set(key, list);
  }

  const savedGroups = new Map<string, Array<{ amountMinor: number; currency: Currency }>>();
  for (const row of waterfall) {
    const year = row.year ?? row.date.getFullYear();
    const month = row.month ?? row.date.getMonth() + 1;
    const key = monthKey(year, month);
    const list = savedGroups.get(key) ?? [];
    list.push({
      amountMinor: row.amountMinor,
      currency: row.currency as Currency,
    });
    savedGroups.set(key, list);
  }

  const wf = waterfallFromScope(scope);
  const spentByKey = groupSum(spentGroups, reporting, rates);
  spentByKey[monthKey(currentYear, currentMonth)] = currentSpent;
  return composeMonthSpendSaveRows({
    spentByKey,
    savedByKey: groupSum(savedGroups, reporting, rates),
    currentYear,
    currentMonth,
    currentTake: wf?.lifetimeTakeMinor ?? null,
  });
}
