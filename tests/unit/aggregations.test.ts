/**
 * DB-backed aggregation tests (R3, R5, R6, R7, R8, R12) against a dedicated
 * SQLite test database (created fresh by tests/global-setup.ts).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getIncomeForMonth } from "@/lib/queries/income";
import { getExpenses } from "@/lib/queries/expenses";
import { getPlanMatrix } from "@/lib/queries/plan";
import { getOverview } from "@/lib/queries/overview";
import { getBalanceSeries } from "@/lib/queries/balance";
import { getSavings } from "@/lib/queries/savings";
import type { Rates } from "@/lib/money";

const RATES: Rates = { usdToCrc: "500", mxnToCrc: "25" };
let userId: string;
let foodId: string;
let rentId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: "test@test.local", passwordHash: "x" },
  });
  userId = user.id;

  const food = await prisma.category.create({ data: { userId, name: "Food" } });
  const rent = await prisma.category.create({ data: { userId, name: "Rent" } });
  foodId = food.id;
  rentId = rent.id;

  // Income: July 2026 — H1 $1,000 USD, H2 MX$5,000 MXN (actual), plus a planned entry.
  await prisma.incomeEntry.createMany({
    data: [
      { userId, year: 2026, month: 7, period: "H1", amountMinor: 100000, currency: "USD" },
      { userId, year: 2026, month: 7, period: "H2", amountMinor: 500000, currency: "MXN" },
      { userId, year: 2026, month: 7, period: "H1", amountMinor: 999900, currency: "USD", planned: true },
      // August income for balance series
      { userId, year: 2026, month: 8, period: "H1", amountMinor: 100000, currency: "USD" },
    ],
  });

  // Expenses: July — $100 USD food (H1), MX$1,000 MXN rent (H2); August — $50 USD.
  await prisma.expense.createMany({
    data: [
      { userId, date: new Date(2026, 6, 10, 12), amountMinor: 10000, currency: "USD", categoryId: foodId },
      { userId, date: new Date(2026, 6, 20, 12), amountMinor: 100000, currency: "MXN", categoryId: rentId },
      { userId, date: new Date(2026, 7, 5, 12), amountMinor: 5000, currency: "USD", categoryId: foodId },
    ],
  });

  // Plan: Food ₡100 in Jan + ₡200 in Feb; Rent ₡300 in Jan.
  await prisma.planCell.createMany({
    data: [
      { userId, categoryId: foodId, year: 2026, month: 1, amountMinor: 10000, currency: "CRC" },
      { userId, categoryId: foodId, year: 2026, month: 2, amountMinor: 20000, currency: "CRC" },
      { userId, categoryId: rentId, year: 2026, month: 1, amountMinor: 30000, currency: "CRC" },
    ],
  });

  // Lifetime savings: ₡10,000 in June, ₡5,000 in July, withdrawal -₡2,000 in July.
  await prisma.savingsContribution.createMany({
    data: [
      { userId, date: new Date(2026, 5, 10, 12), amountMinor: 1000000, currency: "CRC" },
      { userId, date: new Date(2026, 6, 5, 12), amountMinor: 500000, currency: "CRC" },
      { userId, date: new Date(2026, 6, 20, 12), amountMinor: -200000, currency: "CRC" },
    ],
  });

  await prisma.settings.create({
    data: {
      userId,
      usdToCrcRate: "500",
      mxnToCrcRate: "25",
      reportingCurrency: "CRC",
      startingBalanceMinor: 100000, // ₡1,000
      startingBalanceCurrency: "CRC",
    },
  });
});

describe("income totals (R3)", () => {
  it("computes per-period and monthly totals excluding planned entries", async () => {
    const data = await getIncomeForMonth(userId, 2026, 7, "CRC", RATES);
    // H1: $1,000 → ₡500,000 (50000000 minor)
    expect(data.totalH1).toBe(50000000);
    // H2: MX$5,000 → ₡125,000 (12500000 minor)
    expect(data.totalH2).toBe(12500000);
    expect(data.totalMonth).toBe(62500000);
    expect(data.entries).toHaveLength(3);
  });

  it("reports null totals when a rate is missing (R5)", async () => {
    const data = await getIncomeForMonth(userId, 2026, 7, "CRC", {
      usdToCrc: null,
      mxnToCrc: "25",
    });
    expect(data.totalH1).toBeNull();
  });
});

describe("expense listing and conversion (R4, R5)", () => {
  it("shows native and converted values for USD and MXN expenses", async () => {
    const data = await getExpenses(userId, { year: 2026, month: 7 }, "CRC", RATES);
    expect(data.expenses).toHaveLength(2);
    const usd = data.expenses.find((e) => e.currency === "USD")!;
    const mxn = data.expenses.find((e) => e.currency === "MXN")!;
    expect(usd.amountMinor).toBe(10000); // original preserved
    expect(usd.convertedMinor).toBe(5000000); // ₡50,000
    expect(mxn.convertedMinor).toBe(2500000); // ₡25,000
    expect(data.totalMinor).toBe(7500000);
  });

  it("filters by category", async () => {
    const data = await getExpenses(
      userId,
      { year: 2026, month: 7, categoryId: foodId },
      "CRC",
      RATES
    );
    expect(data.expenses).toHaveLength(1);
    expect(data.expenses[0].categoryName).toBe("Food");
  });

  it("supports a cross-currency reporting view (USD expense shown in MXN)", async () => {
    const data = await getExpenses(
      userId,
      { year: 2026, month: 7, categoryId: foodId },
      "MXN",
      RATES
    );
    // $100 → ₡50,000 → MX$2,000 (200000 minor)
    expect(data.expenses[0].convertedMinor).toBe(200000);
  });
});

describe("plan matrix totals (R6)", () => {
  it("computes row, column, and grand totals", async () => {
    const matrix = await getPlanMatrix(userId, 2026, "CRC", RATES);
    const food = matrix.rows.find((r) => r.categoryName === "Food")!;
    const rent = matrix.rows.find((r) => r.categoryName === "Rent")!;
    expect(food.rowTotal).toBe(30000); // ₡100 + ₡200
    expect(rent.rowTotal).toBe(30000); // ₡300
    expect(matrix.columnTotals[0]).toBe(40000); // Jan: ₡100 + ₡300
    expect(matrix.columnTotals[1]).toBe(20000); // Feb: ₡200
    expect(matrix.grandTotal).toBe(60000);
  });

  it("joins actual spend per category and month", async () => {
    const matrix = await getPlanMatrix(userId, 2026, "CRC", RATES);
    const food = matrix.rows.find((r) => r.categoryName === "Food")!;
    expect(food.actual[6]).toBe(5000000); // July: $100 → ₡50,000
  });
});

describe("monthly overview (R7, R12)", () => {
  it("computes earned, spent, saved, remaining for July 2026", async () => {
    const o = await getOverview(userId, 2026, 7, "CRC", RATES);
    expect(o.earned).toBe(62500000); // ₡625,000
    expect(o.spent).toBe(7500000); // ₡75,000
    expect(o.saved).toBe(300000); // ₡5,000 − ₡2,000 = ₡3,000
    expect(o.remaining).toBe(62500000 - 7500000 - 300000);
    // Lifetime balance: ₡10,000 + ₡5,000 − ₡2,000 = ₡13,000
    expect(o.lifetimeSavingsBalance).toBe(1300000);
    // Per-period breakdown
    expect(o.perPeriod.H1.earned).toBe(50000000);
    expect(o.perPeriod.H2.earned).toBe(12500000);
    expect(o.perPeriod.H1.spent).toBe(5000000);
    expect(o.perPeriod.H2.spent).toBe(2500000);
  });

  it("renders zeros for an empty month", async () => {
    const o = await getOverview(userId, 2025, 1, "CRC", RATES);
    expect(o.earned).toBe(0);
    expect(o.spent).toBe(0);
    expect(o.saved).toBe(0);
    expect(o.remaining).toBe(0);
  });
});

describe("running balance (R8)", () => {
  it("computes the running series across two months", async () => {
    const series = await getBalanceSeries(userId, {
      rates: RATES,
      reportingCurrency: "CRC",
      startingBalanceMinor: 100000,
      startingBalanceCurrency: "CRC",
    });
    expect(series.startingBalance).toBe(100000);
    // Periods with data: Jul H1, Jul H2, Aug H1
    expect(series.rows).toHaveLength(3);
    const [julH1, julH2, augH1] = series.rows;
    expect(julH1.income).toBe(50000000);
    expect(julH1.expenses).toBe(5000000);
    expect(julH1.runningBalance).toBe(100000 + 50000000 - 5000000);
    expect(julH2.runningBalance).toBe(
      100000 + 50000000 - 5000000 + 12500000 - 2500000
    );
    expect(augH1.runningBalance).toBe(
      100000 + 50000000 - 5000000 + 12500000 - 2500000 + 50000000 - 2500000
    );
    expect(series.currentBalance).toBe(augH1.runningBalance);
  });
});

describe("lifetime savings (R12)", () => {
  it("computes the cumulative balance and monthly contribution totals", async () => {
    const june = await getSavings(userId, "CRC", RATES, { year: 2026, month: 6 });
    expect(june.balanceMinor).toBe(1300000);
    expect(june.monthTotalMinor).toBe(1000000);

    const july = await getSavings(userId, "CRC", RATES, { year: 2026, month: 7 });
    expect(july.monthTotalMinor).toBe(300000);
    expect(july.contributions).toHaveLength(3);
  });
});
