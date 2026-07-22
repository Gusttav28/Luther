"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { settingsSchema, fieldErrors } from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";
import { safeMaterializeMonth, yearMonthFromDate } from "@/lib/queries/materialize";

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = settingsSchema.safeParse({
      usdToCrcRate: formData.get("usdToCrcRate") ?? "",
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
        reportingCurrency: data.reportingCurrency,
        startingBalanceMinor: data.startingBalance,
        startingBalanceCurrency: data.startingBalanceCurrency,
      },
      create: {
        userId,
        usdToCrcRate: data.usdToCrcRate,
        reportingCurrency: data.reportingCurrency,
        startingBalanceMinor: data.startingBalance,
        startingBalanceCurrency: data.startingBalanceCurrency,
      },
    });
    const now = new Date();
    const { year, month } = yearMonthFromDate(now);
    await safeMaterializeMonth(userId, year, month);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}
