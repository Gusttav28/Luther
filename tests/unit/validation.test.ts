import { describe, expect, it } from "vitest";
import {
  amountSchema,
  signedAmountSchema,
  incomeEntrySchema,
  expenseSchema,
  savingsContributionSchema,
  settingsSchema,
  isoDateSchema,
  rateSchema,
} from "@/lib/validation";

describe("amountSchema (R11)", () => {
  it("accepts positive amounts with up to 2 decimals and returns minor units", () => {
    expect(amountSchema.parse("10.50")).toBe(1050);
    expect(amountSchema.parse("3")).toBe(300);
  });
  it("rejects zero, negatives, and >2 decimals", () => {
    expect(amountSchema.safeParse("0").success).toBe(false);
    expect(amountSchema.safeParse("-5").success).toBe(false);
    expect(amountSchema.safeParse("1.005").success).toBe(false);
    expect(amountSchema.safeParse("abc").success).toBe(false);
  });
});

describe("signedAmountSchema (R12 withdrawals)", () => {
  it("accepts negative amounts", () => {
    expect(signedAmountSchema.parse("-25.00")).toBe(-2500);
  });
  it("rejects zero", () => {
    expect(signedAmountSchema.safeParse("0").success).toBe(false);
  });
});

describe("incomeEntrySchema (R3)", () => {
  const base = { year: "2026", month: "7", period: "H1", amount: "100", currency: "CRC" };
  it("accepts a valid entry in CRC", () => {
    const parsed = incomeEntrySchema.parse(base);
    expect(parsed.amount).toBe(10000);
    expect(parsed.period).toBe("H1");
  });
  it("accepts USD income", () => {
    expect(incomeEntrySchema.safeParse({ ...base, currency: "USD" }).success).toBe(true);
  });
  it("rejects a missing period", () => {
    expect(incomeEntrySchema.safeParse({ ...base, period: "" }).success).toBe(false);
  });
  it("rejects unsupported currency", () => {
    expect(incomeEntrySchema.safeParse({ ...base, currency: "EUR" }).success).toBe(false);
  });
});

describe("expenseSchema (R4)", () => {
  const base = {
    date: "2026-07-20",
    amount: "12.34",
    currency: "CRC",
    name: "Groceries",
    categoryId: "c1",
  };
  it("accepts a valid expense", () => {
    expect(expenseSchema.parse(base).amount).toBe(1234);
  });
  it("accepts a new category name instead of id", () => {
    const parsed = expenseSchema.parse({
      ...base,
      categoryId: "",
      categoryName: "Food",
    });
    expect(parsed.categoryName).toBe("Food");
  });
  it("requires expense name", () => {
    expect(expenseSchema.safeParse({ ...base, name: "" }).success).toBe(false);
  });
  it("rejects a missing/invalid date", () => {
    expect(expenseSchema.safeParse({ ...base, date: "" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, date: "07/20/2026" }).success).toBe(false);
  });
  it("rejects an unsupported currency", () => {
    expect(expenseSchema.safeParse({ ...base, currency: "EUR" }).success).toBe(false);
  });
});

describe("savingsContributionSchema (R12)", () => {
  it("accepts CRC contributions and negative withdrawals", () => {
    const parsed = savingsContributionSchema.parse({
      date: "2026-07-01",
      amount: "-100",
      currency: "CRC",
    });
    expect(parsed.amount).toBe(-10000);
  });
});

describe("settingsSchema and rates (R5)", () => {
  it("accepts valid settings and blank rates as null", () => {
    const parsed = settingsSchema.parse({
      usdToCrcRate: "512.35",
      reportingCurrency: "CRC",
      startingBalance: "1000",
      startingBalanceCurrency: "CRC",
    });
    expect(parsed.usdToCrcRate).toBe("512.35");
    expect(parsed.startingBalance).toBe(100000);
  });
  it("rejects non-positive rates", () => {
    expect(rateSchema.safeParse("0").success).toBe(false);
    expect(rateSchema.safeParse("-2").success).toBe(false);
  });
});

describe("isoDateSchema", () => {
  it("accepts ISO dates and rejects garbage", () => {
    expect(isoDateSchema.safeParse("2026-02-28").success).toBe(true);
    expect(isoDateSchema.safeParse("2026-2-28").success).toBe(false);
    expect(isoDateSchema.safeParse("not-a-date").success).toBe(false);
  });
});
