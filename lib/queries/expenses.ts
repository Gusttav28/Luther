import { prisma } from "@/lib/prisma";
import {
  convertMinor,
  MissingRateError,
  type Currency,
  type Rates,
} from "@/lib/money";

export interface ExpenseRow {
  id: string;
  date: Date;
  amountMinor: number;
  currency: Currency;
  categoryId: string;
  categoryName: string;
  note: string | null;
  /** Converted to reporting currency; null when the needed rate is unset. */
  convertedMinor: number | null;
}

export interface ExpenseList {
  expenses: ExpenseRow[];
  /** Total in reporting currency; null when any needed rate is unset. */
  totalMinor: number | null;
}

export async function getExpenses(
  userId: string,
  filter: { year: number; month: number; categoryId?: string },
  reporting: Currency,
  rates: Rates
): Promise<ExpenseList> {
  const start = new Date(filter.year, filter.month - 1, 1);
  const end = new Date(filter.year, filter.month, 1);

  const rows = await prisma.expense.findMany({
    where: {
      userId,
      date: { gte: start, lt: end },
      ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  let total: number | null = 0;
  const expenses: ExpenseRow[] = rows.map((r) => {
    let converted: number | null;
    try {
      converted = convertMinor(r.amountMinor, r.currency as Currency, reporting, rates);
    } catch (error) {
      if (!(error instanceof MissingRateError)) throw error;
      converted = null;
    }
    if (converted === null) total = null;
    else if (total !== null) total += converted;
    return {
      id: r.id,
      date: r.date,
      amountMinor: r.amountMinor,
      currency: r.currency as Currency,
      categoryId: r.categoryId,
      categoryName: r.category.name,
      note: r.note,
      convertedMinor: converted,
    };
  });

  return { expenses, totalMinor: total };
}

export async function getActiveCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId, archived: false },
    orderBy: { name: "asc" },
  });
}
