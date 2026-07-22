import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency, type Rates } from "@/lib/money";
import { materializeMonthWaterfall } from "@/lib/queries/waterfall-scope";
import { computeWaterfall } from "@/lib/waterfall";
import { getScopeAmounts } from "@/lib/queries/waterfall-scope";
import { getLifetimeSavingsBalance } from "@/lib/queries/overview";

export interface SavingsRow {
  id: string;
  date: Date;
  amountMinor: number;
  currency: Currency;
  note: string | null;
  source: string;
}

export interface SavingsSummary {
  contributions: SavingsRow[];
  balanceMinor: number | null;
  monthTotalMinor: number | null;
  leftoverMinor: number | null;
  lifetimeTakeMinor: number | null;
  postLifetimeMinor: number | null;
}

export async function getSavings(
  userId: string,
  reporting: Currency,
  rates: Rates,
  monthRef?: { year: number; month: number },
  options?: { skipMaterialize?: boolean; materialize?: boolean }
): Promise<SavingsSummary> {
  if (
    monthRef &&
    (options?.materialize === true || options?.skipMaterialize === false)
  ) {
    await materializeMonthWaterfall(userId, monthRef.year, monthRef.month, reporting, rates);
  }

  const [rows, balanceMinor] = await Promise.all([
    prisma.savingsContribution.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    }),
    getLifetimeSavingsBalance(userId, reporting, rates),
  ]);

  const contributions: SavingsRow[] = rows.map((r) => ({
    id: r.id,
    date: r.date,
    amountMinor: r.amountMinor,
    currency: r.currency as Currency,
    note: r.note,
    source: r.source,
  }));

  let monthTotalMinor: number | null = 0;
  let leftoverMinor: number | null = null;
  let lifetimeTakeMinor: number | null = null;
  let postLifetimeMinor: number | null = null;

  if (monthRef) {
    const inMonth = contributions.filter(
      (c) =>
        c.date.getFullYear() === monthRef.year && c.date.getMonth() + 1 === monthRef.month
    );
    monthTotalMinor = sumInCurrency(
      inMonth.map((c) => ({ amountMinor: c.amountMinor, currency: c.currency })),
      reporting,
      rates
    );
    const scope = await getScopeAmounts(
      userId,
      monthRef.year,
      monthRef.month,
      "BOTH",
      reporting,
      rates
    );
    if (scope.plannedIncomeMinor !== null && scope.expensesMinor !== null) {
      const wf = computeWaterfall({
        plannedIncomeMinor: scope.plannedIncomeMinor,
        expensesMinor: scope.expensesMinor,
      });
      leftoverMinor = wf.leftoverMinor;
      lifetimeTakeMinor = wf.lifetimeTakeMinor;
      postLifetimeMinor = wf.postLifetimeMinor;
    }
  }

  return {
    contributions,
    balanceMinor,
    monthTotalMinor,
    leftoverMinor,
    lifetimeTakeMinor,
    postLifetimeMinor,
  };
}

export async function wouldGoNegative(
  userId: string,
  newAmountMinor: number,
  newCurrency: Currency,
  rates: Rates,
  excludeId?: string
): Promise<boolean> {
  if (newAmountMinor >= 0) return false;
  const rows = await prisma.savingsContribution.findMany({
    where: { userId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { amountMinor: true, currency: true },
  });
  const all = [
    ...rows.map((r) => ({ amountMinor: r.amountMinor, currency: r.currency as Currency })),
    { amountMinor: newAmountMinor, currency: newCurrency },
  ];
  const total = sumInCurrency(all, "CRC", rates);
  if (total !== null) return total < 0;
  const sameCurrency = all
    .filter((r) => r.currency === newCurrency)
    .reduce((acc, r) => acc + r.amountMinor, 0);
  return sameCurrency < 0;
}
