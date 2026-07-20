import { describe, expect, it } from "vitest";
import {
  convertMinor,
  formatMinor,
  isValidRate,
  MissingRateError,
  missingRates,
  parseAmountToMinor,
  sumInCurrency,
  type Rates,
} from "@/lib/money";

const RATES: Rates = { usdToCrc: "500", mxnToCrc: "25" };

describe("convertMinor (R5)", () => {
  it("converts USD to CRC using the stored rate", () => {
    // $10.00 = 1000 minor; ₡500/$ → ₡5,000.00 = 500000 minor
    expect(convertMinor(1000, "USD", "CRC", RATES)).toBe(500000);
  });

  it("converts MXN to CRC using the stored rate", () => {
    expect(convertMinor(1000, "MXN", "CRC", RATES)).toBe(25000);
  });

  it("converts CRC to USD (inverse rate)", () => {
    expect(convertMinor(500000, "CRC", "USD", RATES)).toBe(1000);
  });

  it("derives USD→MXN through the CRC pivot", () => {
    // $10 → ₡5,000 → MX$200 (500/25 = 20 MXN per USD)
    expect(convertMinor(1000, "USD", "MXN", RATES)).toBe(20000);
  });

  it("derives MXN→USD through the CRC pivot", () => {
    expect(convertMinor(20000, "MXN", "USD", RATES)).toBe(1000);
  });

  it("changing a rate changes the result", () => {
    const higher: Rates = { usdToCrc: "600", mxnToCrc: "25" };
    expect(convertMinor(1000, "USD", "CRC", higher)).toBe(600000);
    expect(convertMinor(1000, "USD", "MXN", higher)).toBe(24000);
  });

  it("rounds half-up with fractional rates", () => {
    const rates: Rates = { usdToCrc: "512.35", mxnToCrc: "28.1" };
    // $1.01 = 101 minor → 101 * 512.35 = 51747.35 → 51747
    expect(convertMinor(101, "USD", "CRC", rates)).toBe(51747);
    // 3 minor CRC → USD: 3 / 512.35 = 0.00586 minor → 0
    expect(convertMinor(3, "CRC", "USD", rates)).toBe(0);
  });

  it("handles negative amounts (withdrawals)", () => {
    expect(convertMinor(-1000, "USD", "CRC", RATES)).toBe(-500000);
  });

  it("returns the amount unchanged for same-currency", () => {
    expect(convertMinor(123, "USD", "USD", { usdToCrc: null, mxnToCrc: null })).toBe(123);
  });

  it("throws MissingRateError when a needed rate is unset", () => {
    expect(() => convertMinor(100, "USD", "CRC", { usdToCrc: null, mxnToCrc: "25" })).toThrow(
      MissingRateError
    );
    expect(() => convertMinor(100, "CRC", "MXN", { usdToCrc: "500", mxnToCrc: null })).toThrow(
      MissingRateError
    );
  });
});

describe("sumInCurrency (R5)", () => {
  it("sums mixed currencies into the reporting currency", () => {
    const total = sumInCurrency(
      [
        { amountMinor: 1000, currency: "USD" }, // ₡500,000? no — ₡5,000.00 = 500000 minor
        { amountMinor: 1000, currency: "MXN" }, // ₡250.00 = 25000 minor
        { amountMinor: 12345, currency: "CRC" },
      ],
      "CRC",
      RATES
    );
    expect(total).toBe(500000 + 25000 + 12345);
  });

  it("returns null when a needed rate is missing", () => {
    const total = sumInCurrency(
      [{ amountMinor: 1000, currency: "USD" }],
      "CRC",
      { usdToCrc: null, mxnToCrc: "25" }
    );
    expect(total).toBeNull();
  });
});

describe("parseAmountToMinor (R11)", () => {
  it("parses valid amounts", () => {
    expect(parseAmountToMinor("0.01")).toBe(1);
    expect(parseAmountToMinor("1234.56")).toBe(123456);
    expect(parseAmountToMinor("10")).toBe(1000);
    expect(parseAmountToMinor("10.5")).toBe(1050);
  });

  it("rejects invalid amounts", () => {
    expect(parseAmountToMinor("")).toBeNull();
    expect(parseAmountToMinor("abc")).toBeNull();
    expect(parseAmountToMinor("1.234")).toBeNull(); // 3 fraction digits
    expect(parseAmountToMinor("-5")).toBeNull();
    expect(parseAmountToMinor("1,000")).toBeNull();
  });
});

describe("formatMinor", () => {
  it("formats CRC with the colón symbol", () => {
    expect(formatMinor(500000, "CRC")).toBe("₡5,000.00");
  });
  it("formats negatives", () => {
    expect(formatMinor(-1050, "USD")).toBe("-$10.50");
  });
  it("formats MXN", () => {
    expect(formatMinor(123456, "MXN")).toBe("MX$1,234.56");
  });
});

describe("rate helpers", () => {
  it("validates rates", () => {
    expect(isValidRate("512.35")).toBe(true);
    expect(isValidRate("0")).toBe(false);
    expect(isValidRate("-1")).toBe(false);
    expect(isValidRate("abc")).toBe(false);
  });
  it("reports missing rates", () => {
    expect(missingRates({ usdToCrc: null, mxnToCrc: "25" })).toEqual(["USD"]);
    expect(missingRates({ usdToCrc: "500", mxnToCrc: "25" })).toEqual([]);
  });
});
