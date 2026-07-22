import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency } from "@/lib/money";
import { periodOfDate, periodIndex, type PeriodRef } from "@/lib/periods";
import type { AppSettings } from "./settings";

export interface BalancePeriodRow {
  ref: PeriodRef;
  income: number | null;
  expenses: number | null;
  net: number | null;
  runningBalance: number | null;
}

export interface BalanceSeries {
  startingBalance: number | null;
  rows: BalancePeriodRow[];
  currentBalance: number | null;
}

function addNullable(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return a + b;
}

/**
 * Running balance (R8): starting balance + cumulative income − cumulative
 * expenses, in reporting currency, one row per half-month period that has data.
 */
export async function getBalanceSeries(
  userId: string,
  settings: AppSettings
): Promise<BalanceSeries> {
  const { reportingCurrency: reporting, rates } = settings;

  const [income, expenses] = await Promise.all([
    prisma.incomeEntry.findMany({
      where: { userId, planned: false },
      select: { amountMinor: true, currency: true, year: true, month: true, period: true },
    }),
    prisma.expense.findMany({
      select: { amountMinor: true, currency: true, date: true },
      where: { userId, completed: true },
    }),
  ]);

  type Bucket = {
    ref: PeriodRef;
    income: Array<{ amountMinor: number; currency: Currency }>;
    expenses: Array<{ amountMinor: number; currency: Currency }>;
  };
  const buckets = new Map<number, Bucket>();

  const bucketFor = (ref: PeriodRef): Bucket => {
    const key = periodIndex(ref);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { ref, income: [], expenses: [] };
      buckets.set(key, bucket);
    }
    return bucket;
  };

  for (const entry of income) {
    const ref: PeriodRef = {
      year: entry.year,
      month: entry.month,
      period: entry.period as PeriodRef["period"],
    };
    bucketFor(ref).income.push({
      amountMinor: entry.amountMinor,
      currency: entry.currency as Currency,
    });
  }
  for (const expense of expenses) {
    bucketFor(periodOfDate(expense.date)).expenses.push({
      amountMinor: expense.amountMinor,
      currency: expense.currency as Currency,
    });
  }

  const startingBalance = sumInCurrency(
    [
      {
        amountMinor: settings.startingBalanceMinor,
        currency: settings.startingBalanceCurrency,
      },
    ],
    reporting,
    rates
  );

  const sorted = [...buckets.values()].sort(
    (a, b) => periodIndex(a.ref) - periodIndex(b.ref)
  );

  let running: number | null = startingBalance;
  const rows: BalancePeriodRow[] = sorted.map((bucket) => {
    const periodIncome = sumInCurrency(bucket.income, reporting, rates);
    const periodExpenses = sumInCurrency(bucket.expenses, reporting, rates);
    const net =
      periodIncome === null || periodExpenses === null
        ? null
        : periodIncome - periodExpenses;
    running = addNullable(running, net);
    return {
      ref: bucket.ref,
      income: periodIncome,
      expenses: periodExpenses,
      net,
      runningBalance: running,
    };
  });

  return { startingBalance, rows, currentBalance: running };
}
