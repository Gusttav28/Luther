"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { expenseSchema, fieldErrors } from "@/lib/validation";
import { resolveCategoryId } from "@/lib/category-resolve";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";
import {
  safeMaterializeMonth,
  yearMonthFromDateInput,
} from "@/lib/queries/materialize";

function parseForm(formData: FormData) {
  return expenseSchema.safeParse({
    date: formData.get("date") ?? "",
    amount: formData.get("amount") ?? "",
    currency: formData.get("currency"),
    name: formData.get("name") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    categoryName: formData.get("categoryName") ?? "",
  });
}

export async function createExpenseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = parseForm(formData);
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const categoryId = await resolveCategoryId(
      userId,
      parsed.data.categoryId,
      parsed.data.categoryName
    );
    if (!categoryId) {
      return { errors: { categoryName: "Choose or type a category name" } };
    }

    const { date, amount, currency, name } = parsed.data;
    await prisma.expense.create({
      data: {
        userId,
        date: new Date(`${date}T12:00:00`),
        amountMinor: amount,
        currency,
        categoryId,
        name,
        completed: false,
      },
    });
    const ym = yearMonthFromDateInput(date);
    await safeMaterializeMonth(userId, ym.year, ym.month);
    revalidatePath("/expenses");
    revalidatePath("/plan");
    revalidatePath("/");
    revalidatePath("/savings");
    revalidatePath("/projects");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function setExpenseCompletedAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const completed = formData.get("completed") === "true";
  const existing = await prisma.expense.findFirst({
    where: { id, userId },
    select: { date: true },
  });
  await prisma.expense.updateMany({
    where: { id, userId },
    data: { completed },
  });
  if (existing) {
    const ym = yearMonthFromDateInput(existing.date);
    await safeMaterializeMonth(userId, ym.year, ym.month);
  }
  revalidatePath("/expenses");
  revalidatePath("/plan");
  revalidatePath("/");
  revalidatePath("/savings");
  revalidatePath("/projects");
}

export async function updateExpenseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const id = String(formData.get("id") ?? "");
    const parsed = parseForm(formData);
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const categoryId = await resolveCategoryId(
      userId,
      parsed.data.categoryId,
      parsed.data.categoryName
    );
    if (!categoryId) {
      return { errors: { categoryName: "Choose or type a category name" } };
    }

    const { date, amount, currency, name } = parsed.data;
    const result = await prisma.expense.updateMany({
      where: { id, userId },
      data: {
        date: new Date(`${date}T12:00:00`),
        amountMinor: amount,
        currency,
        categoryId,
        name,
      },
    });
    if (result.count === 0) return GENERIC_ERROR;
    const ym = yearMonthFromDateInput(date);
    await safeMaterializeMonth(userId, ym.year, ym.month);
    revalidatePath("/expenses");
    revalidatePath("/plan");
    revalidatePath("/");
    revalidatePath("/savings");
    revalidatePath("/projects");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.expense.findFirst({
    where: { id, userId },
    select: { date: true },
  });
  await prisma.expense.deleteMany({ where: { id, userId } });
  if (existing) {
    const ym = yearMonthFromDateInput(existing.date);
    await safeMaterializeMonth(userId, ym.year, ym.month);
  }
  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/savings");
  revalidatePath("/projects");
}

function monthBounds(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

/** Map a source expense date into the target calendar month (clamp day if needed). */
function mapDateToMonth(source: Date, toYear: number, toMonth: number): Date {
  const day = source.getDate();
  const lastDay = new Date(toYear, toMonth, 0).getDate();
  return new Date(toYear, toMonth - 1, Math.min(day, lastDay), 12, 0, 0, 0);
}

/**
 * Copy every expense from one month into another as new editable rows.
 * Used by Export plan on the Expenses page so the target month gets the same
 * detailed list (name, category, amount, day) — not only category plan cells.
 */
export async function copyExpensesMonthAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const fromYear = Number(formData.get("fromYear"));
    const fromMonth = Number(formData.get("fromMonth"));
    const toYear = Number(formData.get("toYear"));
    const toMonth = Number(formData.get("toMonth"));

    if (
      !Number.isInteger(fromYear) ||
      !Number.isInteger(fromMonth) ||
      fromMonth < 1 ||
      fromMonth > 12 ||
      !Number.isInteger(toYear) ||
      !Number.isInteger(toMonth) ||
      toMonth < 1 ||
      toMonth > 12
    ) {
      return { errors: { _form: "Invalid month selection" } };
    }

    if (fromYear === toYear && fromMonth === toMonth) {
      return { errors: { _form: "Choose a different target month" } };
    }

    const targetBounds = monthBounds(toYear, toMonth);
    const existingCount = await prisma.expense.count({
      where: {
        userId,
        date: { gte: targetBounds.start, lte: targetBounds.end },
      },
    });
    if (existingCount > 0) {
      return {
        errors: {
          _form: `This month already has ${existingCount} expense${existingCount === 1 ? "" : "s"}. Delete them first if you want to export again.`,
        },
      };
    }

    const sourceBounds = monthBounds(fromYear, fromMonth);
    const source = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: sourceBounds.start, lte: sourceBounds.end },
      },
      orderBy: { date: "asc" },
    });

    if (source.length === 0) {
      return {
        errors: {
          _form:
            "No expenses in the previous month to export. Add them for that month first, then try again.",
        },
      };
    }

    await prisma.expense.createMany({
      data: source.map((expense) => ({
        userId,
        date: mapDateToMonth(expense.date, toYear, toMonth),
        amountMinor: expense.amountMinor,
        currency: expense.currency,
        categoryId: expense.categoryId,
        name: expense.name,
        completed: false,
      })),
    });

    await safeMaterializeMonth(userId, toYear, toMonth);
    revalidatePath("/expenses");
    revalidatePath("/plan");
    revalidatePath("/");
    revalidatePath("/savings");
    revalidatePath("/projects");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}
