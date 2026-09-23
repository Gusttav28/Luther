import { describe, expect, it } from "vitest";
import { attachSubcategorySpend, selectedCategoryTotal } from "@/lib/category-spend";

const subscriptions = { categoryId: "sub", amountMinor: 35_00 };
const market = { categoryId: "mkt", amountMinor: 20_00 };
const rent = { categoryId: "rent", amountMinor: null };

describe("selectedCategoryTotal", () => {
  it("is null when nothing is selected (caller shows the full total)", () => {
    expect(selectedCategoryTotal([subscriptions, market], [])).toBeNull();
  });

  it("returns one category amount", () => {
    expect(selectedCategoryTotal([subscriptions, market], ["sub"])).toBe(35_00);
  });

  it("adds a second selected category", () => {
    expect(selectedCategoryTotal([subscriptions, market], ["sub", "mkt"])).toBe(55_00);
  });

  it("stays null when a selected slice is missing FX", () => {
    expect(selectedCategoryTotal([subscriptions, rent], ["sub", "rent"])).toBeNull();
  });
});

describe("attachSubcategorySpend", () => {
  it("lists General plus each child under a parent", () => {
    const leafTotals = new Map<string, number | null>([
      ["sub", 10_00],
      ["tv", 20_00],
      ["ai", 5_00],
    ]);
    const attached = attachSubcategorySpend(
      [{ categoryId: "sub", name: "Subscriptions", amountMinor: 35_00, share: 1 }],
      [
        { id: "sub", name: "Subscriptions", parentId: null },
        { id: "tv", name: "TV", parentId: "sub" },
        { id: "ai", name: "AI", parentId: "sub" },
      ],
      leafTotals
    );
    expect(attached[0].children).toEqual([
      { categoryId: "sub", name: "General", amountMinor: 10_00 },
      { categoryId: "ai", name: "AI", amountMinor: 5_00 },
      { categoryId: "tv", name: "TV", amountMinor: 20_00 },
    ]);
  });

  it("returns no children when the parent has no subcategories", () => {
    const attached = attachSubcategorySpend(
      [{ categoryId: "rent", name: "Rent", amountMinor: 10_00, share: 1 }],
      [{ id: "rent", name: "Rent", parentId: null }],
      new Map([["rent", 10_00]])
    );
    expect(attached[0].children).toEqual([]);
  });
});
