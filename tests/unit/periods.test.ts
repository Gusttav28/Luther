import { describe, expect, it } from "vitest";
import {
  addPeriods,
  comparePeriods,
  nextPeriod,
  periodDateRange,
  periodLabel,
  periodOfDate,
} from "@/lib/periods";

describe("periodOfDate (R3)", () => {
  it("puts day 1 and day 15 in H1", () => {
    expect(periodOfDate(new Date(2026, 6, 1)).period).toBe("H1");
    expect(periodOfDate(new Date(2026, 6, 15)).period).toBe("H1");
  });

  it("puts day 16 and month end in H2", () => {
    expect(periodOfDate(new Date(2026, 6, 16)).period).toBe("H2");
    expect(periodOfDate(new Date(2026, 6, 31)).period).toBe("H2");
  });

  it("handles February end", () => {
    const ref = periodOfDate(new Date(2026, 1, 28));
    expect(ref).toEqual({ year: 2026, month: 2, period: "H2" });
  });
});

describe("period ordering and arithmetic", () => {
  it("orders H1 before H2 within a month and across months", () => {
    expect(
      comparePeriods(
        { year: 2026, month: 7, period: "H1" },
        { year: 2026, month: 7, period: "H2" }
      )
    ).toBeLessThan(0);
    expect(
      comparePeriods(
        { year: 2026, month: 12, period: "H2" },
        { year: 2027, month: 1, period: "H1" }
      )
    ).toBeLessThan(0);
  });

  it("advances across month and year boundaries", () => {
    expect(nextPeriod({ year: 2026, month: 7, period: "H1" })).toEqual({
      year: 2026,
      month: 7,
      period: "H2",
    });
    expect(nextPeriod({ year: 2026, month: 12, period: "H2" })).toEqual({
      year: 2027,
      month: 1,
      period: "H1",
    });
    expect(addPeriods({ year: 2026, month: 7, period: "H1" }, 3)).toEqual({
      year: 2026,
      month: 8,
      period: "H2",
    });
  });
});

describe("periodDateRange and label", () => {
  it("covers H2 through the true month end", () => {
    const { start, end } = periodDateRange({ year: 2026, month: 2, period: "H2" });
    expect(start.getDate()).toBe(16);
    expect(end.getDate()).toBe(28);
  });

  it("labels periods for humans", () => {
    expect(periodLabel({ year: 2026, month: 7, period: "H1" })).toBe("Jul 1–15, 2026");
    expect(periodLabel({ year: 2026, month: 7, period: "H2" })).toBe("Jul 16–31, 2026");
  });
});
