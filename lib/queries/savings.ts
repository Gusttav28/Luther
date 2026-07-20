import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency, type Rates } from "@/lib/money";

export interface SavingsRow {
  id: string;
  date: Date;
  amountMinor: number;
  currency: Currency;
  note: string | null;
}

export interface SavingsSummary {
  contributions: SavingsRow[];
  /** Cumulative lifetime balance in reporting currency; null when a rate is unset. */
  balanceMinor: number | null;
  /** This month's contributions total in reporting currency. */
  monthTotalMinor: number | null;
}

export async function getSavings(
  userId: string,
  reporting: Currency,
  rates: Rates,
  monthRef?: { year: number; month: number }
): Promise<SavingsSummary> {
  const rows = await prisma.savingsContribution.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  const contributions: SavingsRow[] = rows.map((r) => ({
    id: r.id,
    date: r.date,
    amountMinor: r.amountMinor,
    currency: r.currency as Currency,
    note: r.note,
  }));

  const balanceMinor = sumInCurrency(
    contributions.map((c) => ({ amountMinor: c.amountMinor, currency: c.currency })),
    reporting,
    rates
  );

  let monthTotalMinor: number | null = 0;
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
  }

  return { contributions, balanceMinor, monthTotalMinor };
}

/**
 * Lifetime balance in CRC-equivalent minor units for withdrawal validation.
 * Falls back to per-currency validation when rates are missing.
 */
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
  // Rates missing: validate within the withdrawal's own currency.
  const sameCurrency = all
    .filter((r) => r.currency === newCurrency)
    .reduce((acc, r) => acc + r.amountMinor, 0);
  return sameCurrency < 0;
}
