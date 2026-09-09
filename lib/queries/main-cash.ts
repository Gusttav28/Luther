import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  convertMinor,
  MissingRateError,
  type Currency,
  type Rates,
} from "@/lib/money";

type AccountDelegate = Pick<PrismaClient, "account" | "settings">;

function isMissingAccountSchema(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code: unknown }).code) : "";
  const message = "message" in error ? String((error as { message: unknown }).message) : "";
  if (code === "P2021") return true;
  return /does not exist/i.test(message) && /Account/i.test(message);
}

export interface MainCashStore {
  openingMinor: number;
  currency: Currency;
  accountId: string | null;
}

/** Pure: next stored Main opening after a signed charge delta. */
export function mainOpeningAfterDelta(openingMinor: number, deltaMinor: number): number {
  return openingMinor + deltaMinor;
}

export function mainCashDeltaForChargeToggle(
  wasCompleted: boolean,
  willBeCompleted: boolean,
  convertedMinor: number
): number {
  if (!wasCompleted && willBeCompleted) return -convertedMinor;
  if (wasCompleted && !willBeCompleted) return convertedMinor;
  return 0;
}

export function mainCashDeltaForAmountEdit(
  completed: boolean,
  oldConvertedMinor: number,
  newConvertedMinor: number
): number {
  if (!completed) return 0;
  return oldConvertedMinor - newConvertedMinor;
}

export function convertToStoredMain(
  amountMinor: number,
  from: Currency,
  to: Currency,
  rates: Rates
): number | null {
  try {
    return convertMinor(amountMinor, from, to, rates);
  } catch (error) {
    if (error instanceof MissingRateError) return null;
    throw error;
  }
}

export async function loadMainCashStore(
  userId: string,
  db: AccountDelegate = prisma
): Promise<MainCashStore> {
  let main: { id: string; openingMinor: number; currency: string } | null = null;
  try {
    main = await db.account.findFirst({
      where: { userId, kind: "MAIN" },
      select: { id: true, openingMinor: true, currency: true },
    });
  } catch (error) {
    if (!isMissingAccountSchema(error)) throw error;
  }

  if (main) {
    return {
      openingMinor: main.openingMinor,
      currency: main.currency as Currency,
      accountId: main.id,
    };
  }

  const settings = await db.settings.findUnique({
    where: { userId },
    select: { startingBalanceMinor: true, startingBalanceCurrency: true },
  });
  return {
    openingMinor: settings?.startingBalanceMinor ?? 0,
    currency: (settings?.startingBalanceCurrency ?? "CRC") as Currency,
    accountId: null,
  };
}

/** Add `deltaMinor` (Main stored currency) to MAIN opening and Settings starting. */
export async function applyMainCashDelta(
  userId: string,
  deltaMinor: number,
  db: AccountDelegate = prisma
): Promise<void> {
  if (deltaMinor === 0) return;

  const store = await loadMainCashStore(userId, db);
  const next = mainOpeningAfterDelta(store.openingMinor, deltaMinor);

  try {
    if (store.accountId) {
      await db.account.update({
        where: { id: store.accountId },
        data: { openingMinor: next },
      });
    } else {
      await db.account.create({
        data: {
          userId,
          name: "Main",
          kind: "MAIN",
          openingMinor: next,
          currency: store.currency,
        },
      });
    }
  } catch (error) {
    if (!isMissingAccountSchema(error)) throw error;
  }

  await db.settings.upsert({
    where: { userId },
    update: {
      startingBalanceMinor: next,
      startingBalanceCurrency: store.currency,
    },
    create: {
      userId,
      startingBalanceMinor: next,
      startingBalanceCurrency: store.currency,
    },
  });
}
