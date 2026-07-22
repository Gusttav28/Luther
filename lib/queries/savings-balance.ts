import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency, type Rates } from "@/lib/money";

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
  return sumInCurrency(
    grouped.map((g) => ({
      amountMinor: g._sum.amountMinor ?? 0,
      currency: g.currency as Currency,
    })),
    reporting,
    rates
  );
}
