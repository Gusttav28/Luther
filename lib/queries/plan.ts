import { prisma } from "@/lib/prisma";
import {
  convertMinor,
  MissingRateError,
  type Currency,
  type Rates,
} from "@/lib/money";

export interface PlanMatrixRow {
  categoryId: string;
  categoryName: string;
  archived: boolean;
  /** Planned minor units per month index 0-11, converted to reporting. Null = rate missing. */
  planned: (number | null)[];
  /** Raw stored plan values (CRC minor units) for editing, per month index 0-11. */
  plannedRaw: number[];
  /** Actual expenses per month index 0-11 in reporting currency. Null = rate missing. */
  actual: (number | null)[];
  rowTotal: number | null;
}

export interface PlanMatrix {
  year: number;
  rows: PlanMatrixRow[];
  columnTotals: (number | null)[];
  grandTotal: number | null;
}

function addNullable(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return a + b;
}

function safeConvert(
  amountMinor: number,
  from: Currency,
  to: Currency,
  rates: Rates
): number | null {
  try {
    return convertMinor(amountMinor, from, to, rates);
  } catch (error) {
    if (error instanceof MissingRateError) return null;
    throw error;
  }
}

export async function getPlanMatrix(
  userId: string,
  year: number,
  reporting: Currency,
  rates: Rates
): Promise<PlanMatrix> {
  const [categories, cells, expenses] = await Promise.all([
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.planCell.findMany({ where: { userId, year } }),
    prisma.expense.findMany({
      where: {
        userId,
        completed: true,
        date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      },
      select: { categoryId: true, date: true, amountMinor: true, currency: true },
    }),
  ]);

  const rows: PlanMatrixRow[] = categories
    .filter((c) => !c.archived || cells.some((cell) => cell.categoryId === c.id))
    .map((category) => {
      const planned: (number | null)[] = Array.from({ length: 12 }, () => 0);
      const plannedRaw: number[] = Array.from({ length: 12 }, () => 0);
      const actual: (number | null)[] = Array.from({ length: 12 }, () => 0);

      for (const cell of cells.filter((c) => c.categoryId === category.id)) {
        plannedRaw[cell.month - 1] += cell.amountMinor;
        planned[cell.month - 1] = addNullable(
          planned[cell.month - 1],
          safeConvert(cell.amountMinor, cell.currency as Currency, reporting, rates)
        );
      }
      for (const expense of expenses.filter((e) => e.categoryId === category.id)) {
        const monthIdx = expense.date.getMonth();
        actual[monthIdx] = addNullable(
          actual[monthIdx],
          safeConvert(expense.amountMinor, expense.currency as Currency, reporting, rates)
        );
      }

      const rowTotal = planned.reduce<number | null>((acc, v) => addNullable(acc, v), 0);
      return {
        categoryId: category.id,
        categoryName: category.name,
        archived: category.archived,
        planned,
        plannedRaw,
        actual,
        rowTotal,
      };
    });

  const columnTotals: (number | null)[] = Array.from({ length: 12 }, (_, monthIdx) =>
    rows.reduce<number | null>((acc, row) => addNullable(acc, row.planned[monthIdx]), 0)
  );
  const grandTotal = columnTotals.reduce<number | null>(
    (acc, v) => addNullable(acc, v),
    0
  );

  return { year, rows, columnTotals, grandTotal };
}
