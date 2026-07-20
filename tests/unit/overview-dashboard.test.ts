import { describe, expect, it } from "vitest";
import {
  computeMomDeltas,
  priorMonth,
} from "@/lib/queries/overview-dashboard";
import type { OverviewFigures } from "@/lib/queries/overview";

const base: OverviewFigures = {
  earned: 100_00,
  spent: 40_00,
  saved: 10_00,
  remaining: 50_00,
  perPeriod: {
    H1: { earned: 50_00, spent: 20_00, saved: 5_00 },
    H2: { earned: 50_00, spent: 20_00, saved: 5_00 },
  },
  lifetimeSavingsBalance: 500_00,
};

describe("overview-dashboard helpers (R4)", () => {
  it("computes prior calendar month", () => {
    expect(priorMonth(2026, 7)).toEqual({ year: 2026, month: 6 });
    expect(priorMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
  });

  it("computes MoM percent for monthly KPIs", () => {
    const prior: OverviewFigures = {
      ...base,
      earned: 50_00,
      spent: 80_00,
      saved: 10_00,
      remaining: 0,
    };
    const mom = computeMomDeltas(base, prior);
    expect(mom.earned?.percent).toBe(100);
    expect(mom.spent?.percent).toBe(-50);
    expect(mom.saved?.percent).toBe(0);
    expect(mom.remaining?.percent).toBeNull(); // prior remaining 0 → no %
  });

  it("omits MoM when a side is null", () => {
    const prior: OverviewFigures = { ...base, earned: null };
    const mom = computeMomDeltas(base, prior);
    expect(mom.earned?.percent).toBeNull();
    expect(mom.earned?.absolute).toBeNull();
  });
});
