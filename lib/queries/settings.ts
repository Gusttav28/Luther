import { prisma } from "@/lib/prisma";
import type { Currency, Rates } from "@/lib/money";

export interface AppSettings {
  rates: Rates;
  reportingCurrency: Currency;
  startingBalanceMinor: number;
  startingBalanceCurrency: Currency;
}

export interface AllocationInfo {
  amountMinor: number;
  currency: Currency;
}

/** Settings with safe defaults (fresh install: CRC reporting, rates unset). */
export async function getSettings(userId: string): Promise<AppSettings> {
  const row = await prisma.settings.findUnique({ where: { userId } });
  return {
    rates: {
      usdToCrc: row?.usdToCrcRate ?? null,
      mxnToCrc: row?.mxnToCrcRate ?? null,
    },
    reportingCurrency: (row?.reportingCurrency ?? "CRC") as Currency,
    startingBalanceMinor: row?.startingBalanceMinor ?? 0,
    startingBalanceCurrency: (row?.startingBalanceCurrency ?? "CRC") as Currency,
  };
}

export async function getAllocation(userId: string): Promise<AllocationInfo> {
  const row = await prisma.allocationSetting.findUnique({ where: { userId } });
  return {
    amountMinor: row?.amountMinor ?? 0,
    currency: (row?.currency ?? "CRC") as Currency,
  };
}
