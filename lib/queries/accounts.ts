import { getBalanceSeries } from "@/lib/queries/balance";
import { getLifetimeSavingsBalance } from "@/lib/queries/overview";
import type { AppSettings } from "@/lib/queries/settings";

export interface DerivedAccounts {
  /** starting + received − charged − Savings. */
  mainAccountMinor: number | null;
  /** Lifetime savings balance. */
  savingsAccountMinor: number | null;
  /** starting + received − charged (= Balance currentBalance). */
  totalCashMinor: number | null;
}

/**
 * Derived Main / Savings / Total cash. No Account model.
 * Identity when rates exist: Main + Savings = Balance currentBalance.
 */
export async function getDerivedAccounts(
  userId: string,
  settings: AppSettings
): Promise<DerivedAccounts> {
  const [series, savingsAccountMinor] = await Promise.all([
    getBalanceSeries(userId, settings),
    getLifetimeSavingsBalance(userId, settings.reportingCurrency, settings.rates),
  ]);
  const totalCashMinor = series.currentBalance;
  const mainAccountMinor =
    totalCashMinor === null || savingsAccountMinor === null
      ? null
      : totalCashMinor - savingsAccountMinor;
  return { mainAccountMinor, savingsAccountMinor, totalCashMinor };
}
