import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency, type Rates } from "@/lib/money";
import type { HalfPeriod } from "@/lib/periods";

export interface IncomeRow {
  id: string;
  period: HalfPeriod;
  amountMinor: number;
  currency: Currency;
  label: string | null;
  planned: boolean;
}

export interface IncomeMonth {
  entries: IncomeRow[];
  /** Totals in the reporting currency; null when a needed rate is unset. */
  totalH1: number | null;
  totalH2: number | null;
  totalMonth: number | null;
}

export async function getIncomeForMonth(
  userId: string,
  year: number,
  month: number,
  reporting: Currency,
  rates: Rates
): Promise<IncomeMonth> {
  const rows = await prisma.incomeEntry.findMany({
    where: { userId, year, month },
    orderBy: [{ period: "asc" }, { label: "asc" }],
  });

  const entries: IncomeRow[] = rows.map((r) => ({
    id: r.id,
    period: r.period as HalfPeriod,
    amountMinor: r.amountMinor,
    currency: r.currency as Currency,
    label: r.label,
    planned: r.planned,
  }));

  const actual = entries.filter((e) => !e.planned);
  const toSum = (list: IncomeRow[]) =>
    sumInCurrency(
      list.map((e) => ({ amountMinor: e.amountMinor, currency: e.currency })),
      reporting,
      rates
    );

  return {
    entries,
    totalH1: toSum(actual.filter((e) => e.period === "H1")),
    totalH2: toSum(actual.filter((e) => e.period === "H2")),
    totalMonth: toSum(actual),
  };
}
