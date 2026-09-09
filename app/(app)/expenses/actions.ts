"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { expenseSchema, fieldErrors, parseCompletedCreate } from "@/lib/validation";
import { resolveCategoryId } from "@/lib/category-resolve";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";
import {
  safeMaterializeMonth,
  yearMonthFromDateInput,
} from "@/lib/queries/materialize";
import { getSettings } from "@/lib/queries/settings";
import {
  applyMainCashDelta,
  convertToStoredMain,
  loadMainCashStore,
  mainCashDeltaForAmountEdit,
  mainCashDeltaForChargeToggle,
} from "@/lib/queries/main-cash";
import type { Currency } from "@/lib/money";

async function convertedExpenseToMain(
  userId: string,
  amountMinor: number,
  currency: string
): Promise<number | null> {
  const [store, settings] = await Promise.all([
    loadMainCashStore(userId),
    getSettings(userId),
  ]);
  return convertToStoredMain(
    amountMinor,
    currency as Currency,
    store.currency,
    settings.rates
  );
}

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
    const completedParsed = parseCompletedCreate(formData.get("completed"));
    if (!parsed.success || !completedParsed.success) {
      return {
        errors: {
          ...(parsed.success ? {} : fieldErrors(parsed.error)),
          ...(completedParsed.success ? {} : { completed: "Choose Planning or Already charged" }),
        },
      };
    }

    const categoryId = await resolveCategoryId(
      userId,
      parsed.data.categoryId,
      parsed.data.categoryName
    );
    if (!categoryId) {
      return { errors: { categoryName: "Choose or type a category name" } };
    }

    const { date, amount, currency, name } = parsed.data;
    const completed = completedParsed.data;
    let chargeConverted: number | null = 0;
    if (completed) {
      chargeConverted = await convertedExpenseToMain(userId, amount, currency);
      if (chargeConverted === null) return GENERIC_ERROR;
    }
    await prisma.$transaction(async (tx) => {
      await tx.expense.create({
        data: {
          userId,
          date: new Date(`${date}T12:00:00`),
          amountMinor: amount,
          currency,
          categoryId,
          name,
          completed,
        },
      });
      if (completed && chargeConverted !== null) {
        await applyMainCashDelta(userId, -chargeConverted, tx);
      }
    });
    const ym = yearMonthFromDateInput(date);
    await safeMaterializeMonth(userId, ym.year, ym.month);
    revalidatePath("/expenses");
    revalidatePath("/plan");
    revalidatePath("/");
    revalidatePath("/savings");
    revalidatePath("/projects");
    revalidatePath("/balance");
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
    select: { date: true, completed: true, amountMinor: true, currency: true },
  });
  if (!existing) return;

  const converted = await convertedExpenseToMain(
    userId,
    existing.amountMinor,
    existing.currency
  );
  const delta = mainCashDeltaForChargeToggle(
    existing.completed,
    completed,
    converted ?? 0
  );
  if (delta !== 0 && converted === null) return;

  await prisma.$transaction(async (tx) => {
    if (delta !== 0) {
      await applyMainCashDelta(userId, delta, tx);
    }
    await tx.expense.updateMany({
      where: { id, userId },
      data: { completed },
    });
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
  revalidatePath("/balance");
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
    const existing = await prisma.expense.findFirst({
      where: { id, userId },
      select: { completed: true, amountMinor: true, currency: true },
    });
    if (!existing) return GENERIC_ERROR;

    let delta = 0;
    if (existing.completed) {
      const oldConverted = await convertedExpenseToMain(
        userId,
        existing.amountMinor,
        existing.currency
      );
      const newConverted = await convertedExpenseToMain(userId, amount, currency);
      if (oldConverted === null || newConverted === null) return GENERIC_ERROR;
      delta = mainCashDeltaForAmountEdit(true, oldConverted, newConverted);
    }

    const result = await prisma.$transaction(async (tx) => {
      if (delta !== 0) {
        await applyMainCashDelta(userId, delta, tx);
      }
      return tx.expense.updateMany({
        where: { id, userId },
        data: {
          date: new Date(`${date}T12:00:00`),
          amountMinor: amount,
          currency,
          categoryId,
          name,
        },
      });
    });
    if (result.count === 0) return GENERIC_ERROR;
    const ym = yearMonthFromDateInput(date);
    await safeMaterializeMonth(userId, ym.year, ym.month);
    revalidatePath("/expenses");
    revalidatePath("/plan");
    revalidatePath("/");
    revalidatePath("/savings");
    revalidatePath("/projects");
    revalidatePath("/balance");
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
    select: { date: true, completed: true, amountMinor: true, currency: true },
  });
  if (!existing) return;

  let restore = 0;
  if (existing.completed) {
    const converted = await convertedExpenseToMain(
      userId,
      existing.amountMinor,
      existing.currency
    );
    if (converted === null) return;
    restore = converted;
  }

  await prisma.$transaction(async (tx) => {
    if (restore !== 0) {
      await applyMainCashDelta(userId, restore, tx);
    }
    await tx.expense.deleteMany({ where: { id, userId } });
  });
  if (existing) {
    const ym = yearMonthFromDateInput(existing.date);
    await safeMaterializeMonth(userId, ym.year, ym.month);
  }
  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/savings");
  revalidatePath("/projects");
  revalidatePath("/balance");
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
    revalidatePath("/balance");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}
