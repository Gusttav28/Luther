"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { incomeEntrySchema, fieldErrors } from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";
import { safeMaterializeMonth } from "@/lib/queries/materialize";

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
    await safeMaterializeMonth(userId, rest.year, rest.month);
    revalidatePath("/income");
    revalidatePath("/");
    revalidatePath("/savings");
    revalidatePath("/projects");
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
    await safeMaterializeMonth(userId, rest.year, rest.month);
    revalidatePath("/income");
    revalidatePath("/");
    revalidatePath("/savings");
    revalidatePath("/projects");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function deleteIncomeAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.incomeEntry.findFirst({
    where: { id, userId },
    select: { year: true, month: true },
  });
  await prisma.incomeEntry.deleteMany({ where: { id, userId } });
  if (existing) {
    await safeMaterializeMonth(userId, existing.year, existing.month);
  }
  revalidatePath("/income");
  revalidatePath("/");
  revalidatePath("/savings");
  revalidatePath("/projects");
}
