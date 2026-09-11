import { prisma } from "@/lib/prisma";
import { sumInCurrency, type Currency } from "@/lib/money";
import { getBalanceSeries } from "@/lib/queries/balance";
import { getLifetimeSavingsBalance } from "@/lib/queries/overview";
import { savingsCardHeadline } from "@/lib/queries/balance-months";
import { getScopeAmounts, waterfallFromScope } from "@/lib/queries/waterfall-scope";
import { savingsMonthBreakdownFromTakes } from "@/lib/waterfall";
import type { AppSettings } from "@/lib/queries/settings";

export interface DerivedAccounts {
  /** Stored Main opening (Settings starting if no MAIN row), reporting currency. */
  mainAccountMinor: number | null;
  /** This month’s 70% leftover take. */
  savingsAccountMinor: number | null;
  /** This month’s remaining Planning expenses. */
  plannedExpensesMinor: number | null;
  /** starting + received − charged (= Balance currentBalance). */
  totalCashMinor: number | null;
}

/**
 * Overview account cards: typed Main, month take, remaining Planning.
 */
export async function getDerivedAccounts(
  userId: string,
  settings: AppSettings,
  year: number,
  month: number
): Promise<DerivedAccounts> {
  const [series, scope] = await Promise.all([
    getBalanceSeries(userId, settings),
    getScopeAmounts(
      userId,
      year,
      month,
      "BOTH",
      settings.reportingCurrency,
      settings.rates
    ),
  ]);
  const wf = waterfallFromScope(scope);
  return {
    mainAccountMinor: scope.mainCashMinor,
    savingsAccountMinor: wf?.lifetimeTakeMinor ?? null,
    plannedExpensesMinor: scope.planningExpensesMinor,
    totalCashMinor: series.currentBalance,
  };
}

export type AccountKind = "MAIN" | "SAVINGS" | "CUSTOM";

export interface SavingsMonthBreakdown {
  fromMain: number | null;
  fromPlanned: number | null;
  projectedSum: number | null;
}

export { savingsMonthBreakdownFromTakes };

function isMissingAccountSchema(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code: unknown }).code) : "";
  const message = "message" in error ? String((error as { message: unknown }).message) : "";
  if (code === "P2021") return true;
  return /does not exist/i.test(message) && /Account/i.test(message);
}

async function loadAccountRows(userId: string) {
  try {
    return await prisma.account.findMany({
      where: { userId },
      include: { entries: { select: { amountMinor: true, currency: true } } },
      orderBy: [{ createdAt: "asc" }],
    });
  } catch (error) {
    if (isMissingAccountSchema(error)) return [];
    throw error;
  }
}

export interface BalanceAccountView {
  id: string;
  name: string;
  kind: AccountKind;
  openingMinor: number;
  currency: Currency;
  /** Reporting-currency display balance; null when a needed rate is missing. */
  balanceMinor: number | null;
}

export interface BalanceAccountsPage {
  accounts: BalanceAccountView[];
  hasMain: boolean;
  hasSavings: boolean;
  breakdown: SavingsMonthBreakdown;
  leftoverHintMinor: number | null;
  reportingCurrency: Currency;
  startingOpeningPrefill: string;
  startingOpeningCurrency: Currency;
}

function toReporting(
  amounts: Array<{ amountMinor: number; currency: string }>,
  reporting: Currency,
  rates: AppSettings["rates"]
): number | null {
  return sumInCurrency(
    amounts.map((a) => ({ amountMinor: a.amountMinor, currency: a.currency as Currency })),
    reporting,
    rates
  );
}

export async function listUserAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
  });
}

export async function getSavingsAllTimeMinor(
  userId: string,
  settings: AppSettings,
  savingsOpening?: { openingMinor: number; currency: string } | null
): Promise<number | null> {
  const lifetime = await getLifetimeSavingsBalance(
    userId,
    settings.reportingCurrency,
    settings.rates
  );
  if (!savingsOpening) return lifetime;
  const opening = toReporting(
    [{ amountMinor: savingsOpening.openingMinor, currency: savingsOpening.currency }],
    settings.reportingCurrency,
    settings.rates
  );
  if (lifetime === null || opening === null) return null;
  return opening + lifetime;
}

export async function getCurrentMonthBreakdown(
  userId: string,
  settings: AppSettings,
  now: Date = new Date()
): Promise<{ breakdown: SavingsMonthBreakdown; leftoverHintMinor: number | null }> {
  const scope = await getScopeAmounts(
    userId,
    now.getFullYear(),
    now.getMonth() + 1,
    "BOTH",
    settings.reportingCurrency,
    settings.rates
  );
  const wf = waterfallFromScope(scope);
  const fromMain = wf?.lifetimeTakeMinor ?? null;
  return {
    breakdown: savingsMonthBreakdownFromTakes(fromMain, 0),
    leftoverHintMinor: wf?.postLifetimeMinor ?? null,
  };
}

function customBalanceMinor(
  openingMinor: number,
  openingCurrency: string,
  entries: Array<{ amountMinor: number; currency: string }>,
  settings: AppSettings
): number | null {
  return toReporting(
    [
      { amountMinor: openingMinor, currency: openingCurrency },
      ...entries.map((e) => ({ amountMinor: e.amountMinor, currency: e.currency })),
    ],
    settings.reportingCurrency,
    settings.rates
  );
}

export async function getBalanceAccountsPage(
  userId: string,
  settings: AppSettings
): Promise<BalanceAccountsPage> {
  const [rows, month] = await Promise.all([
    loadAccountRows(userId),
    getCurrentMonthBreakdown(userId, settings),
  ]);

  const kindOrder: Record<AccountKind, number> = { MAIN: 0, SAVINGS: 1, CUSTOM: 2 };
  const accounts: BalanceAccountView[] = rows
    .map((row) => {
      let balanceMinor: number | null;
      if (row.kind === "MAIN") {
        // Card shows the opening the owner entered (same currency as saved).
        balanceMinor = row.openingMinor;
      } else if (row.kind === "SAVINGS") {
        balanceMinor = savingsCardHeadline(month.breakdown.fromMain);
      } else {
        balanceMinor = customBalanceMinor(
          row.openingMinor,
          row.currency,
          row.entries,
          settings
        );
      }
      return {
        id: row.id,
        name: row.name,
        kind: row.kind,
        openingMinor: row.openingMinor,
        currency: row.currency as Currency,
        balanceMinor,
      };
    })
    .sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.name.localeCompare(b.name));

  return {
    accounts,
    hasMain: rows.some((r) => r.kind === "MAIN"),
    hasSavings: rows.some((r) => r.kind === "SAVINGS"),
    breakdown: month.breakdown,
    leftoverHintMinor: month.leftoverHintMinor,
    reportingCurrency: settings.reportingCurrency,
    startingOpeningPrefill: (settings.startingBalanceMinor / 100).toFixed(2),
    startingOpeningCurrency: settings.startingBalanceCurrency,
  };
}
