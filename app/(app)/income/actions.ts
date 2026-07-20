"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { incomeEntrySchema, fieldErrors } from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";

function parseForm(formData: FormData) {
  return incomeEntrySchema.safeParse({
    year: formData.get("year"),
    month: formData.get("month"),
    period: formData.get("period"),
    amount: formData.get("amount") ?? "",
    currency: formData.get("currency"),
    label: formData.get("label") ?? "",
    planned: formData.get("planned") === "on",
  });
}

export async function createIncomeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = parseForm(formData);
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { amount, ...rest } = parsed.data;
    await prisma.incomeEntry.create({
      data: { userId, amountMinor: amount, ...rest },
    });
    revalidatePath("/income");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function updateIncomeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const id = String(formData.get("id") ?? "");
    const parsed = parseForm(formData);
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { amount, ...rest } = parsed.data;
    const result = await prisma.incomeEntry.updateMany({
      where: { id, userId },
      data: { amountMinor: amount, ...rest },
    });
    if (result.count === 0) return GENERIC_ERROR;
    revalidatePath("/income");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function deleteIncomeAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  await prisma.incomeEntry.deleteMany({ where: { id, userId } });
  revalidatePath("/income");
}
