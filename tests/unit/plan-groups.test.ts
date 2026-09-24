import { describe, expect, it } from "vitest";
import { groupPlanRows, sumNullable, type PlanGroupRow } from "@/lib/plan-groups";

function row(
  categoryId: string,
  categoryName: string,
  parentId: string | null,
  monthly: Partial<Record<number, number | null>> = {},
  actualMonthly: Partial<Record<number, number | null>> = {}
): PlanGroupRow {
  const planned = Array.from({ length: 12 }, (_, i) => (i in monthly ? monthly[i]! : 0));
  const actual = Array.from({ length: 12 }, (_, i) => (i in actualMonthly ? actualMonthly[i]! : 0));
  return {
    categoryId,
    categoryName,
    parentId,
    archived: false,
    planned,
    plannedRaw: planned.map((v) => v ?? 0),
    actual,
    rowTotal: sumNullable(planned),
  };
}

describe("groupPlanRows", () => {
  const subs = row("sub", "Subscription", null, { 6: 1_000 });
  const netflix = row("nf", "Netflix", "sub", { 6: 8_000, 7: 8_000 }, { 6: 7_500 });
  const spotify = row("sp", "Spotify", "sub", { 6: 5_000 });
  const house = row("house", "House", null, { 6: 190_000 });

  it("sums parent and children for a month (R3)", () => {
    const groups = groupPlanRows([house, netflix, subs, spotify]);
    const sub = groups.find((g) => g.root.categoryId === "sub")!;
    expect(sub.planned[6]).toBe(14_000);
    expect(sub.planned[7]).toBe(8_000);
    expect(sub.actual[6]).toBe(7_500);
    expect(sub.children.map((c) => c.categoryName)).toEqual(["Netflix", "Spotify"]);
  });

  it("totals the year per group (R4)", () => {
    const groups = groupPlanRows([subs, netflix, spotify, house]);
    expect(groups.find((g) => g.root.categoryId === "sub")!.total).toBe(22_000);
    expect(groups.find((g) => g.root.categoryId === "house")!.total).toBe(190_000);
  });

  it("keeps a parent without children as a plain group, sorted by name", () => {
    const groups = groupPlanRows([subs, house, netflix]);
    expect(groups.map((g) => g.root.categoryName)).toEqual(["House", "Subscription"]);
    expect(groups[0].children).toEqual([]);
  });

  it("propagates a missing rate as null", () => {
    const usd = row("ai", "AI", "sub", { 6: null });
    const sub = groupPlanRows([subs, usd]).find((g) => g.root.categoryId === "sub")!;
    expect(sub.planned[6]).toBeNull();
    expect(sub.total).toBeNull();
    expect(sub.planned[7]).toBe(0);
  });

  it("shows a child whose parent is not in the matrix as its own group", () => {
    const orphan = row("nf", "Netflix", "archived-parent", { 6: 8_000 });
    const groups = groupPlanRows([orphan, house]);
    expect(groups.map((g) => g.root.categoryId)).toEqual(["house", "nf"]);
    expect(groups[1].total).toBe(8_000);
  });
});
