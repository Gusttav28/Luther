"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { savingsContributionSchema, fieldErrors } from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";
import { getSettings } from "@/lib/queries/settings";
import { wouldGoNegative } from "@/lib/queries/savings";

function parseForm(formData: FormData) {
  return savingsContributionSchema.safeParse({
    date: formData.get("date") ?? "",
    amount: formData.get("amount") ?? "",
    currency: formData.get("currency"),
    note: formData.get("note") ?? "",
  });
}

const OVERDRAW_ERROR: ActionState = {
  errors: {
    amount: "This withdrawal would make your lifetime savings negative; it was not recorded.",
  },
};

export async function createSavingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = parseForm(formData);
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { date, amount, currency, note } = parsed.data;

    const settings = await getSettings(userId);
    if (await wouldGoNegative(userId, amount, currency, settings.rates)) {
      return OVERDRAW_ERROR;
    }

    await prisma.savingsContribution.create({
      data: { userId, date: new Date(`${date}T12:00:00`), amountMinor: amount, currency, note },
    });
    revalidatePath("/savings");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function updateSavingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const id = String(formData.get("id") ?? "");
    const parsed = parseForm(formData);
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { date, amount, currency, note } = parsed.data;

    const settings = await getSettings(userId);
    if (await wouldGoNegative(userId, amount, currency, settings.rates, id)) {
      return OVERDRAW_ERROR;
    }

    const result = await prisma.savingsContribution.updateMany({
      where: { id, userId },
      data: { date: new Date(`${date}T12:00:00`), amountMinor: amount, currency, note },
    });
    if (result.count === 0) return GENERIC_ERROR;
    revalidatePath("/savings");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function deleteSavingsAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  await prisma.savingsContribution.deleteMany({ where: { id, userId } });
  revalidatePath("/savings");
  revalidatePath("/");
}
