import { describe, expect, it } from "vitest";
import {
  composeMonthSpendSaveRows,
  monthKey,
  savingsCardHeadline,
} from "@/lib/queries/balance-months";
import { computeWaterfall } from "@/lib/waterfall";

describe("savings card headline", () => {
  it("is the leftover take, not opening plus lifetime", () => {
    const take = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 40_000,
    }).lifetimeTakeMinor;
    expect(take).toBe(42_000);
    expect(savingsCardHeadline(take)).toBe(42_000);
    expect(savingsCardHeadline(take)).not.toBe(5_000 + 1_000_000);
    expect(savingsCardHeadline(0)).toBe(0);
    expect(savingsCardHeadline(null)).toBeNull();
  });
});

describe("month spent vs saved rows", () => {
  it("composes spent 10_000 and leftover take 42_000 for one month", () => {
    const take = computeWaterfall({
      mainCashMinor: 100_000,
      remainingPlanningMinor: 40_000,
    }).lifetimeTakeMinor;
    const rows = composeMonthSpendSaveRows({
      spentByKey: { [monthKey(2026, 8)]: 10_000 },
      savedByKey: {},
      currentYear: 2026,
      currentMonth: 8,
      currentTake: take,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe("August 2026");
    expect(rows[0]?.spentMinor).toBe(10_000);
    expect(rows[0]?.savedMinor).toBe(42_000);
  });

  it("uses live leftover take for the current month, not stored waterfall", () => {
    const rows = composeMonthSpendSaveRows({
      spentByKey: { [monthKey(2026, 9)]: 0 },
      savedByKey: { [monthKey(2026, 9)]: 99_000 },
      currentYear: 2026,
      currentMonth: 9,
      currentTake: 42_000,
    });
    expect(rows[0]?.savedMinor).toBe(42_000);
  });

  it("uses stored waterfall for a past month", () => {
    const rows = composeMonthSpendSaveRows({
      spentByKey: { [monthKey(2026, 8)]: 8_000 },
      savedByKey: { [monthKey(2026, 8)]: 14_000 },
      currentYear: 2026,
      currentMonth: 9,
      currentTake: 0,
    });
    const august = rows.find((row) => row.month === 8);
    expect(august?.spentMinor).toBe(8_000);
    expect(august?.savedMinor).toBe(14_000);
  });

  it("sorts newest month first and skips empty current month", () => {
    const rows = composeMonthSpendSaveRows({
      spentByKey: {
        [monthKey(2026, 7)]: 1_000,
        [monthKey(2026, 8)]: 2_000,
      },
      savedByKey: {
        [monthKey(2026, 7)]: 500,
        [monthKey(2026, 8)]: 700,
      },
      currentYear: 2026,
      currentMonth: 9,
      currentTake: 0,
    });
    expect(rows.map((row) => row.month)).toEqual([8, 7]);
  });

  it("keeps a null spent cell instead of coercing to 0", () => {
    const rows = composeMonthSpendSaveRows({
      spentByKey: { [monthKey(2026, 8)]: null },
      savedByKey: { [monthKey(2026, 8)]: 1_000 },
      currentYear: 2026,
      currentMonth: 9,
      currentTake: 0,
    });
    expect(rows[0]?.spentMinor).toBeNull();
    expect(rows[0]?.savedMinor).toBe(1_000);
  });
});
