"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import {
  categoryMoveSchema,
  categorySchema,
  planCellSchema,
  fieldErrors,
} from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = categorySchema.safeParse({
      name: formData.get("name") ?? "",
      parentId: formData.get("parentId") ?? "",
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const existing = await prisma.category.findUnique({
      where: { userId_name: { userId, name: parsed.data.name } },
    });
    if (existing) return { errors: { name: "A category with this name already exists" } };
    let parentId: string | null = null;
    if (parsed.data.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: parsed.data.parentId, userId, parentId: null },
      });
      if (!parent) return { errors: { parentId: "Choose a main category" } };
      parentId = parent.id;
    }
    await prisma.category.create({ data: { userId, name: parsed.data.name, parentId } });
    revalidatePath("/plan");
    revalidatePath("/expenses");
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
    revalidatePath("/expenses");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

/** Only one level: the target must be a main category and the moved one cannot have children. */
export async function setCategoryParentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = categoryMoveSchema.safeParse({
      id: formData.get("id") ?? "",
      parentId: formData.get("parentId") ?? "",
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { id } = parsed.data;

    const category = await prisma.category.findFirst({ where: { id, userId } });
    if (!category) return GENERIC_ERROR;

    let parentId: string | null = null;
    if (parsed.data.parentId) {
      if (parsed.data.parentId === id) {
        return { errors: { _form: "A category cannot be moved under itself." } };
      }
      const parent = await prisma.category.findFirst({
        where: { id: parsed.data.parentId, userId, parentId: null },
      });
      if (!parent) return { errors: { _form: "Choose a main category" } };
      const childCount = await prisma.category.count({ where: { userId, parentId: id } });
      if (childCount > 0) {
        return { errors: { _form: "Move its subcategories first." } };
      }
      parentId = parent.id;
    }

    await prisma.category.updateMany({ where: { id, userId }, data: { parentId } });
    revalidatePath("/plan");
    revalidatePath("/expenses");
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
  revalidatePath("/expenses");
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
    const childCount = await prisma.category.count({ where: { userId, parentId: id } });
    if (childCount > 0) {
      return {
        errors: {
          _form: "Remove or archive subcategories first.",
        },
      };
    }
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
    revalidatePath("/expenses");
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
    revalidatePath("/expenses");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

/**
 * Copy all plan cells from one month into another (upsert).
 * Used to carry a category plan forward without re-entering amounts.
 */
export async function copyPlanMonthAction(
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

    const source = await prisma.planCell.findMany({
      where: { userId, year: fromYear, month: fromMonth },
    });

    if (source.length === 0) {
      return {
        errors: {
          _form:
            "No category plan amounts in the previous month to export. Add them on the Plan screen first.",
        },
      };
    }

    await prisma.$transaction(
      source.map((cell) =>
        prisma.planCell.upsert({
          where: {
            categoryId_year_month: {
              categoryId: cell.categoryId,
              year: toYear,
              month: toMonth,
            },
          },
          update: {
            amountMinor: cell.amountMinor,
            currency: cell.currency,
          },
          create: {
            userId,
            categoryId: cell.categoryId,
            year: toYear,
            month: toMonth,
            amountMinor: cell.amountMinor,
            currency: cell.currency,
          },
        })
      )
    );

    revalidatePath("/plan");
    revalidatePath("/expenses");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}
