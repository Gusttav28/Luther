import { describe, expect, it } from "vitest";
import { projectAffordability } from "@/lib/projections";
import type { PeriodRef } from "@/lib/periods";

const START: PeriodRef = { year: 2026, month: 8, period: "H1" };

describe("projectAffordability (R9)", () => {
  it("funds prioritized projects in order with a fixed per-period allocation", () => {
    // Allocation ₡100.00 (10000 minor) per period.
    // P1 costs ₡250 (needs 3 periods: 100+100+50), P2 costs ₡100 and starts
    // receiving the remaining ₡50 in period 3, finishing in period 4.
    const results = projectAffordability(
      [
        { id: "p1", costMinor: 25000, savedMinor: 0, priority: 1 },
        { id: "p2", costMinor: 10000, savedMinor: 0, priority: 2 },
      ],
      10000,
      START
    );
    expect(results[0].affordablePeriod).toEqual({ year: 2026, month: 9, period: "H1" }); // 3rd period
    expect(results[1].affordablePeriod).toEqual({ year: 2026, month: 9, period: "H2" }); // 4th period
  });

  it("accounts for already-recorded savings", () => {
    const results = projectAffordability(
      [{ id: "p1", costMinor: 25000, savedMinor: 20000, priority: 1 }],
      10000,
      START
    );
    // Needs ₡50 more → affordable in the first simulated period.
    expect(results[0].affordablePeriod).toEqual(START);
    expect(results[0].fundedPercent).toBe(80);
  });

  it("marks fully-funded projects with no future period (affordable now)", () => {
    const results = projectAffordability(
      [{ id: "p1", costMinor: 10000, savedMinor: 10000, priority: 1 }],
      10000,
      START
    );
    expect(results[0].affordablePeriod).toBeNull();
    expect(results[0].fundedPercent).toBe(100);
  });

  it("returns no projection when the allocation is zero or unset (R9 failure case)", () => {
    const results = projectAffordability(
      [{ id: "p1", costMinor: 10000, savedMinor: 0, priority: 1 }],
      0,
      START
    );
    expect(results[0].affordablePeriod).toBeNull();
    expect(results[0].fundedPercent).toBe(0);
  });

  it("respects priority order regardless of input order", () => {
    const results = projectAffordability(
      [
        { id: "low", costMinor: 10000, savedMinor: 0, priority: 5 },
        { id: "high", costMinor: 10000, savedMinor: 0, priority: 1 },
      ],
      10000,
      START
    );
    const high = results.find((r) => r.id === "high")!;
    const low = results.find((r) => r.id === "low")!;
    expect(high.affordablePeriod).toEqual(START);
    expect(low.affordablePeriod).toEqual({ year: 2026, month: 8, period: "H2" });
  });
});
