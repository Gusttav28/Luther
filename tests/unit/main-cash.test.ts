import { describe, expect, it } from "vitest";
import {
  convertToStoredMain,
  mainCashDeltaForAmountEdit,
  mainCashDeltaForChargeToggle,
  mainOpeningAfterDelta,
} from "@/lib/queries/main-cash";

describe("main cash charge delta", () => {
  it("charge ₡10,000 on ₡73,233 → ₡63,233", () => {
    expect(mainOpeningAfterDelta(7_323_300, -1_000_000)).toBe(6_323_300);
  });

  it("un-charge restores Main", () => {
    expect(mainOpeningAfterDelta(6_323_300, 1_000_000)).toBe(7_323_300);
  });

  it("Planning → charged subtracts; charged → Planning adds", () => {
    expect(mainCashDeltaForChargeToggle(false, true, 1_000_000)).toBe(-1_000_000);
    expect(mainCashDeltaForChargeToggle(true, false, 1_000_000)).toBe(1_000_000);
    expect(mainCashDeltaForChargeToggle(true, true, 1_000_000)).toBe(0);
    expect(mainCashDeltaForChargeToggle(false, false, 1_000_000)).toBe(0);
  });

  it("amount edit while charged applies the delta", () => {
    expect(mainCashDeltaForAmountEdit(true, 1_000_000, 500_000)).toBe(500_000);
    expect(mainCashDeltaForAmountEdit(true, 500_000, 1_000_000)).toBe(-500_000);
    expect(mainCashDeltaForAmountEdit(false, 1_000_000, 500_000)).toBe(0);
  });

  it("same-currency convert does not need a rate", () => {
    expect(convertToStoredMain(1_000_000, "CRC", "CRC", { usdToCrc: null })).toBe(1_000_000);
  });

  it("cross-currency convert returns null when the rate is missing", () => {
    expect(convertToStoredMain(100_00, "USD", "CRC", { usdToCrc: null })).toBeNull();
  });
});
