import { describe, expect, it } from "vitest";
import {
  LIFETIME_SAVINGS_PERCENT,
  clampProjectPercent,
  computeWaterfall,
  leftoverAfterReserves,
  percentOf,
  plannedSalaryTakeMinor,
} from "@/lib/waterfall";

describe("waterfall (received leftover after reserved Planning bills)", () => {
  it("computes leftover as received minus charged minus planning", () => {
    const w = computeWaterfall({
      receivedIncomeMinor: 200_000_00,
      chargedExpensesMinor: 80_000_00,
      planningExpensesMinor: 0,
      projectAllocationPercent: 50,
    });
    expect(w.leftoverMinor).toBe(120_000_00);
  });

  it("reserves Planning expenses before leftover", () => {
    expect(leftoverAfterReserves(100_000, 40_000, 20_000)).toBe(40_000);
    const w = computeWaterfall({
      receivedIncomeMinor: 100_000,
      chargedExpensesMinor: 40_000,
      planningExpensesMinor: 20_000,
    });
    expect(w.leftoverMinor).toBe(40_000);
    expect(w.lifetimeTakeMinor).toBe(percentOf(40_000, 70));
  });

  it("blocks saving when leftover after Planning is ≤ 0", () => {
    const over = computeWaterfall({
      receivedIncomeMinor: 100_000,
      chargedExpensesMinor: 40_000,
      planningExpensesMinor: 70_000,
      projectAllocationPercent: 70,
    });
    expect(over.leftoverMinor).toBe(0);
    expect(over.lifetimeTakeMinor).toBe(0);
    expect(over.postLifetimeMinor).toBe(0);
    expect(over.projectTakeMinor).toBe(0);

    const exact = computeWaterfall({
      receivedIncomeMinor: 100_000,
      chargedExpensesMinor: 40_000,
      planningExpensesMinor: 60_000,
    });
    expect(exact.leftoverMinor).toBe(0);
    expect(exact.lifetimeTakeMinor).toBe(0);
  });

  it("takes exactly 70% of leftover with floor rounding, not 70% of gross received", () => {
    expect(LIFETIME_SAVINGS_PERCENT).toBe(70);
    const w = computeWaterfall({
      receivedIncomeMinor: 200_000,
      chargedExpensesMinor: 80_000,
      planningExpensesMinor: 20_000,
    });
    expect(w.leftoverMinor).toBe(100_000);
    expect(w.lifetimeTakeMinor).toBe(70_000);
    expect(w.postLifetimeMinor).toBe(30_000);
    expect(w.lifetimeTakeMinor).not.toBe(percentOf(200_000, 70));
  });

  it("owner walkthrough: leftover 20_000 → lifetime 14_000 → post 6_000 → 50% project = 3_000", () => {
    const leftover = 20_000;
    const w = computeWaterfall({
      receivedIncomeMinor: leftover,
      chargedExpensesMinor: 0,
      planningExpensesMinor: 0,
      projectAllocationPercent: 50,
    });
    expect(w.lifetimeTakeMinor).toBe(14_000);
    expect(w.postLifetimeMinor).toBe(6_000);
    expect(w.projectTakeMinor).toBe(3_000);
  });

  it("zero leftover yields zero takes", () => {
    const w = computeWaterfall({
      receivedIncomeMinor: 50_000,
      chargedExpensesMinor: 80_000,
      planningExpensesMinor: 0,
      projectAllocationPercent: 70,
    });
    expect(w.leftoverMinor).toBe(0);
    expect(w.lifetimeTakeMinor).toBe(0);
    expect(w.postLifetimeMinor).toBe(0);
    expect(w.projectTakeMinor).toBe(0);
  });

  it("clamps project percent to 1–70", () => {
    expect(clampProjectPercent(0)).toBe(1);
    expect(clampProjectPercent(71)).toBe(70);
    expect(clampProjectPercent(50.9)).toBe(50);
  });

  it("hard-caps project take at 70% of post-lifetime", () => {
    const w = computeWaterfall({
      receivedIncomeMinor: 100_000,
      chargedExpensesMinor: 0,
      planningExpensesMinor: 0,
      projectAllocationPercent: 99,
    });
    expect(w.projectTakeMinor).toBe(21_000);
  });

  it("From planned salary is combined take minus received take", () => {
    const fromPlanned = plannedSalaryTakeMinor({
      receivedIncomeMinor: 100_000,
      plannedSalaryMinor: 50_000,
      chargedExpensesMinor: 20_000,
      planningExpensesMinor: 0,
    });
    const actual = computeWaterfall({
      receivedIncomeMinor: 100_000,
      chargedExpensesMinor: 20_000,
      planningExpensesMinor: 0,
    }).lifetimeTakeMinor;
    const combined = computeWaterfall({
      receivedIncomeMinor: 150_000,
      chargedExpensesMinor: 20_000,
      planningExpensesMinor: 0,
    }).lifetimeTakeMinor;
    expect(actual).toBe(56_000);
    expect(combined).toBe(91_000);
    expect(fromPlanned).toBe(35_000);
    expect(actual + fromPlanned).toBe(combined);
  });
});
