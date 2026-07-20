"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { settingsSchema, allocationSchema, fieldErrors } from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = settingsSchema.safeParse({
      usdToCrcRate: formData.get("usdToCrcRate") ?? "",
      mxnToCrcRate: formData.get("mxnToCrcRate") ?? "",
      reportingCurrency: formData.get("reportingCurrency"),
      startingBalance: formData.get("startingBalance") ?? "0",
      startingBalanceCurrency: formData.get("startingBalanceCurrency"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const data = parsed.data;
    await prisma.settings.upsert({
      where: { userId },
      update: {
        usdToCrcRate: data.usdToCrcRate,
        mxnToCrcRate: data.mxnToCrcRate,
        reportingCurrency: data.reportingCurrency,
        startingBalanceMinor: data.startingBalance,
        startingBalanceCurrency: data.startingBalanceCurrency,
      },
      create: {
        userId,
        usdToCrcRate: data.usdToCrcRate,
        mxnToCrcRate: data.mxnToCrcRate,
        reportingCurrency: data.reportingCurrency,
        startingBalanceMinor: data.startingBalance,
        startingBalanceCurrency: data.startingBalanceCurrency,
      },
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { errors: fieldErrors(error) };
    return GENERIC_ERROR;
  }
}

export async function updateAllocationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = allocationSchema.safeParse({
      amount: formData.get("amount") ?? "",
      currency: formData.get("currency"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    await prisma.allocationSetting.upsert({
      where: { userId },
      update: { amountMinor: parsed.data.amount, currency: parsed.data.currency },
      create: { userId, amountMinor: parsed.data.amount, currency: parsed.data.currency },
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}
