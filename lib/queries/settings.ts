import { prisma } from "@/lib/prisma";
import type { Currency, Rates } from "@/lib/money";

export interface AppSettings {
  rates: Rates;
  reportingCurrency: Currency;
  startingBalanceMinor: number;
  startingBalanceCurrency: Currency;
}

/** Settings with safe defaults (fresh install: CRC reporting, rates unset). */
export async function getSettings(userId: string): Promise<AppSettings> {
  const row = await prisma.settings.findUnique({ where: { userId } });
  return {
    rates: {
      usdToCrc: row?.usdToCrcRate ?? null,
    },
    reportingCurrency: (row?.reportingCurrency ?? "CRC") as Currency,
    startingBalanceMinor: row?.startingBalanceMinor ?? 0,
    startingBalanceCurrency: (row?.startingBalanceCurrency ?? "CRC") as Currency,
  };
}
