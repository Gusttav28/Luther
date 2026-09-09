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
  completedCreateSchema,
  parseCompletedCreate,
  accountCreateSchema,
  accountEntrySchema,
  optionalNonNegativeOpeningSchema,
  mainOpeningSchema,
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
  it("still accepts an expense when completed is omitted", () => {
    const parsed = expenseSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect("completed" in parsed.data).toBe(false);
    }
  });
});

describe("completedCreateSchema (expense-create-status)", () => {
  it("maps missing/empty to Planning (false)", () => {
    expect(parseCompletedCreate(null).data).toBe(false);
    expect(parseCompletedCreate(undefined).data).toBe(false);
    expect(completedCreateSchema.parse("")).toBe(false);
  });
  it("maps \"false\" to Planning and \"true\" to Already charged", () => {
    expect(completedCreateSchema.parse("false")).toBe(false);
    expect(completedCreateSchema.parse("true")).toBe(true);
  });
  it("rejects invalid values (does not coerce)", () => {
    expect(completedCreateSchema.safeParse("yes").success).toBe(false);
    expect(completedCreateSchema.safeParse("1").success).toBe(false);
    expect(completedCreateSchema.safeParse("TRUE").success).toBe(false);
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

describe("accountCreateSchema (balance-user-accounts)", () => {
  it("defaults Main and Savings names and accepts Main negative opening", () => {
    const main = accountCreateSchema.parse({
      kind: "MAIN",
      name: "",
      opening: "-25.50",
      currency: "CRC",
    });
    expect(main.name).toBe("Main account");
    expect(main.opening).toBe(-2550);

    const savings = accountCreateSchema.parse({
      kind: "SAVINGS",
      name: "",
      opening: "",
      currency: "USD",
    });
    expect(savings.name).toBe("Savings account");
    expect(savings.opening).toBe(0);
  });

  it("requires a Custom name and does not persist empty names", () => {
    const empty = accountCreateSchema.safeParse({
      kind: "CUSTOM",
      name: "  ",
      opening: "0",
      currency: "CRC",
    });
    expect(empty.success).toBe(false);

    const prizes = accountCreateSchema.parse({
      kind: "CUSTOM",
      name: "Prizes",
      opening: "10",
      currency: "CRC",
    });
    expect(prizes.name).toBe("Prizes");
    expect(prizes.opening).toBe(1000);
  });

  it("rejects a negative Savings opening", () => {
    expect(optionalNonNegativeOpeningSchema.safeParse("-1").success).toBe(false);
    expect(
      accountCreateSchema.safeParse({
        kind: "SAVINGS",
        name: "Savings account",
        opening: "-5",
        currency: "CRC",
      }).success
    ).toBe(false);
    expect(mainOpeningSchema.parse("-5")).toBe(-500);
  });
});

describe("accountEntrySchema (custom add/withdraw)", () => {
  const base = {
    accountId: "acc1",
    date: "2026-09-09",
    amount: "12.50",
    currency: "CRC",
    note: "",
  };
  it("accepts add as a positive signed amount", () => {
    const parsed = accountEntrySchema.parse({ ...base, direction: "add" });
    expect(parsed.amount).toBe(1250);
  });
  it("accepts withdraw as a negative signed amount", () => {
    const parsed = accountEntrySchema.parse({ ...base, direction: "withdraw" });
    expect(parsed.amount).toBe(-1250);
  });
  it("rejects zero and empty Custom amounts", () => {
    expect(
      accountEntrySchema.safeParse({ ...base, amount: "0", direction: "add" }).success
    ).toBe(false);
  });
});
