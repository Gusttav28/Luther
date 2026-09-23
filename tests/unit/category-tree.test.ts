import { describe, expect, it } from "vitest";
import {
  categoryFilterIds,
  categoryPathLabel,
  childrenOf,
  rollupSpendToParents,
  rootsOf,
} from "@/lib/category-tree";

const subscriptions = { id: "sub", name: "Subscriptions", parentId: null };
const tv = { id: "tv", name: "TV", parentId: "sub" };
const ai = { id: "ai", name: "AI", parentId: "sub" };
const market = { id: "mkt", name: "Supermarkets", parentId: null };
const protein = { id: "pro", name: "Protein", parentId: "mkt" };
const categories = [subscriptions, tv, ai, market, protein];

describe("category tree", () => {
  it("lists roots and children", () => {
    expect(rootsOf(categories).map((c) => c.name)).toEqual(["Subscriptions", "Supermarkets"]);
    expect(childrenOf(categories, "sub").map((c) => c.name)).toEqual(["AI", "TV"]);
  });

  it("parent filter includes general + every child (R4)", () => {
    expect(categoryFilterIds(categories, "sub")?.sort()).toEqual(["ai", "sub", "tv"]);
    expect(categoryFilterIds(categories, "tv")).toEqual(["tv"]);
    expect(categoryFilterIds(categories, undefined)).toBeUndefined();
  });

  it("path label is Parent · Child", () => {
    expect(categoryPathLabel(categories, "sub")).toBe("Subscriptions");
    expect(categoryPathLabel(categories, "ai")).toBe("Subscriptions · AI");
    expect(categoryPathLabel(categories, "pro")).toBe("Supermarkets · Protein");
  });

  it("rolls child spend into the parent (R5)", () => {
    const rolled = rollupSpendToParents(
      [
        { categoryId: "sub", amountMinor: 10_00 },
        { categoryId: "tv", amountMinor: 20_00 },
        { categoryId: "ai", amountMinor: 5_00 },
        { categoryId: "pro", amountMinor: 8_00 },
      ],
      categories
    );
    expect(rolled).toEqual([
      { categoryId: "sub", name: "Subscriptions", amountMinor: 35_00 },
      { categoryId: "mkt", name: "Supermarkets", amountMinor: 8_00 },
    ]);
  });
});
