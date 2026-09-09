"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import {
  accountCreateSchema,
  accountDeleteSchema,
  accountEntrySchema,
  accountRenameSchema,
  fieldErrors,
  mainOpeningUpdateSchema,
} from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
  );
}

function revalidateBalanceAndHome() {
  revalidatePath("/balance");
  revalidatePath("/", "layout");
}

export async function createAccountAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = accountCreateSchema.safeParse({
      kind: formData.get("kind"),
      name: formData.get("name") ?? "",
      opening: formData.get("opening") ?? "",
      currency: formData.get("currency"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const { kind, name, opening, currency } = parsed.data;

    if (kind === "MAIN" || kind === "SAVINGS") {
      const existing = await prisma.account.findFirst({
        where: { userId, kind },
        select: { id: true },
      });
      if (existing) {
        return {
          errors: {
            kind:
              kind === "MAIN"
                ? "A Main account already exists."
                : "A Savings account already exists.",
          },
        };
      }
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (kind === "MAIN") {
          await tx.settings.upsert({
            where: { userId },
            update: {
              startingBalanceMinor: opening,
              startingBalanceCurrency: currency,
            },
            create: {
              userId,
              startingBalanceMinor: opening,
              startingBalanceCurrency: currency,
            },
          });
        }
        await tx.account.create({
          data: {
            userId,
            name,
            kind,
            openingMinor: opening,
            currency,
          },
        });
      });
    } catch (error) {
      if (isUniqueViolation(error) && (kind === "MAIN" || kind === "SAVINGS")) {
        return {
          errors: {
            kind:
              kind === "MAIN"
                ? "A Main account already exists."
                : "A Savings account already exists.",
          },
        };
      }
      throw error;
    }

    revalidateBalanceAndHome();
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function updateMainOpeningAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = mainOpeningUpdateSchema.safeParse({
      id: formData.get("id") ?? "",
      opening: formData.get("opening") ?? "",
      currency: formData.get("currency"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const { id, opening, currency } = parsed.data;
    const account = await prisma.account.findFirst({
      where: { id, userId, kind: "MAIN" },
      select: { id: true },
    });
    if (!account) return GENERIC_ERROR;

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: account.id },
        data: { openingMinor: opening, currency },
      });
      await tx.settings.upsert({
        where: { userId },
        update: {
          startingBalanceMinor: opening,
          startingBalanceCurrency: currency,
        },
        create: {
          userId,
          startingBalanceMinor: opening,
          startingBalanceCurrency: currency,
        },
      });
    });

    revalidateBalanceAndHome();
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function renameCustomAccountAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = accountRenameSchema.safeParse({
      id: formData.get("id") ?? "",
      name: formData.get("name") ?? "",
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const result = await prisma.account.updateMany({
      where: { id: parsed.data.id, userId, kind: "CUSTOM" },
      data: { name: parsed.data.name },
    });
    if (result.count === 0) return GENERIC_ERROR;
    revalidatePath("/balance");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function deleteCustomAccountAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = accountDeleteSchema.safeParse({ id: formData.get("id") ?? "" });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const account = await prisma.account.findFirst({
      where: { id: parsed.data.id, userId, kind: "CUSTOM" },
      select: { id: true },
    });
    if (!account) return GENERIC_ERROR;

    await prisma.account.delete({ where: { id: account.id } });
    revalidatePath("/balance");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function createAccountEntryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = accountEntrySchema.safeParse({
      accountId: formData.get("accountId") ?? "",
      date: formData.get("date") ?? "",
      amount: formData.get("amount") ?? "",
      currency: formData.get("currency"),
      note: formData.get("note") ?? "",
      direction: formData.get("direction") ?? "add",
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const { accountId, date, amount, currency, note } = parsed.data;
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
      select: { id: true, kind: true },
    });
    if (!account) return GENERIC_ERROR;
    if (account.kind !== "CUSTOM") {
      return { errors: { _form: "Entries can only be recorded on custom accounts." } };
    }

    await prisma.accountEntry.create({
      data: {
        userId,
        accountId: account.id,
        date: new Date(`${date}T12:00:00`),
        amountMinor: amount,
        currency,
        note,
      },
    });
    revalidatePath("/balance");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}
