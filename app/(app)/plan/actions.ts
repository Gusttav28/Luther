"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { categorySchema, planCellSchema, fieldErrors } from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = categorySchema.safeParse({ name: formData.get("name") ?? "" });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const existing = await prisma.category.findUnique({
      where: { userId_name: { userId, name: parsed.data.name } },
    });
    if (existing) return { errors: { name: "A category with this name already exists" } };
    await prisma.category.create({ data: { userId, name: parsed.data.name } });
    revalidatePath("/plan");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function renameCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const id = String(formData.get("id") ?? "");
    const parsed = categorySchema.safeParse({ name: formData.get("name") ?? "" });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const result = await prisma.category.updateMany({
      where: { id, userId },
      data: { name: parsed.data.name },
    });
    if (result.count === 0) return GENERIC_ERROR;
    revalidatePath("/plan");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function setCategoryArchivedAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const archived = formData.get("archived") === "true";
  await prisma.category.updateMany({ where: { id, userId }, data: { archived } });
  revalidatePath("/plan");
}

/**
 * Delete is blocked when expenses reference the category (R6) — archive instead.
 */
export async function deleteCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const id = String(formData.get("id") ?? "");
    const expenseCount = await prisma.expense.count({ where: { userId, categoryId: id } });
    if (expenseCount > 0) {
      return {
        errors: {
          _form: "This category has recorded expenses; archive it instead to preserve history.",
        },
      };
    }
    await prisma.$transaction([
      prisma.planCell.deleteMany({ where: { userId, categoryId: id } }),
      prisma.category.deleteMany({ where: { id, userId } }),
    ]);
    revalidatePath("/plan");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function setPlanCellAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = planCellSchema.safeParse({
      categoryId: formData.get("categoryId") ?? "",
      year: formData.get("year"),
      month: formData.get("month"),
      amount: formData.get("amount") ?? "",
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { categoryId, year, month, amount } = parsed.data;

    const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
    if (!category) return GENERIC_ERROR;

    if (amount === 0) {
      await prisma.planCell.deleteMany({ where: { userId, categoryId, year, month } });
    } else {
      await prisma.planCell.upsert({
        where: { categoryId_year_month: { categoryId, year, month } },
        update: { amountMinor: amount },
        create: { userId, categoryId, year, month, amountMinor: amount, currency: "CRC" },
      });
    }
    revalidatePath("/plan");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}
