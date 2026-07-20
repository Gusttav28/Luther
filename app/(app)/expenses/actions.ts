"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { expenseSchema, fieldErrors } from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";

function parseForm(formData: FormData) {
  return expenseSchema.safeParse({
    date: formData.get("date") ?? "",
    amount: formData.get("amount") ?? "",
    currency: formData.get("currency"),
    categoryId: formData.get("categoryId") ?? "",
    note: formData.get("note") ?? "",
  });
}

async function assertCategoryOwned(userId: string, categoryId: string): Promise<boolean> {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  return category !== null;
}

export async function createExpenseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = parseForm(formData);
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    if (!(await assertCategoryOwned(userId, parsed.data.categoryId))) {
      return { errors: { categoryId: "Choose a valid category" } };
    }
    const { date, amount, ...rest } = parsed.data;
    await prisma.expense.create({
      data: { userId, date: new Date(`${date}T12:00:00`), amountMinor: amount, ...rest },
    });
    revalidatePath("/expenses");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
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
    if (!(await assertCategoryOwned(userId, parsed.data.categoryId))) {
      return { errors: { categoryId: "Choose a valid category" } };
    }
    const { date, amount, ...rest } = parsed.data;
    const result = await prisma.expense.updateMany({
      where: { id, userId },
      data: { date: new Date(`${date}T12:00:00`), amountMinor: amount, ...rest },
    });
    if (result.count === 0) return GENERIC_ERROR;
    revalidatePath("/expenses");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  await prisma.expense.deleteMany({ where: { id, userId } });
  revalidatePath("/expenses");
}
