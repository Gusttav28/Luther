import type { CategoryNode } from "@/lib/category-tree";
import { childrenOf } from "@/lib/category-tree";

export interface SpendChild {
  categoryId: string;
  name: string;
  amountMinor: number | null;
}

export function selectedCategoryTotal(
  categories: Array<{ categoryId: string; amountMinor: number | null }>,
  selectedIds: string[]
): number | null {
  if (selectedIds.length === 0) return null;
  let total = 0;
  for (const id of selectedIds) {
    const category = categories.find((row) => row.categoryId === id);
    if (!category || category.amountMinor === null) return null;
    total += category.amountMinor;
  }
  return total;
}

export function attachSubcategorySpend(
  parents: Array<{
    categoryId: string;
    name: string;
    amountMinor: number | null;
    share: number | null;
  }>,
  categories: CategoryNode[],
  leafTotals: Map<string, number | null>
): Array<{
  categoryId: string;
  name: string;
  amountMinor: number | null;
  share: number | null;
  children: SpendChild[];
}> {
  return parents.map((parent) => {
    const kids = childrenOf(categories, parent.categoryId);
    const children: SpendChild[] = [];
    const general = leafTotals.get(parent.categoryId);
    if (kids.length > 0 && general !== undefined) {
      children.push({
        categoryId: parent.categoryId,
        name: "General",
        amountMinor: general,
      });
    }
    for (const child of kids) {
      children.push({
        categoryId: child.id,
        name: child.name,
        amountMinor: leafTotals.has(child.id) ? (leafTotals.get(child.id) ?? null) : 0,
      });
    }
    return { ...parent, children };
  });
}
