export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  archived?: boolean;
}

export function isRoot(category: CategoryNode): boolean {
  return category.parentId == null;
}

export function findCategory(
  categories: CategoryNode[],
  id: string | undefined
): CategoryNode | undefined {
  if (!id) return undefined;
  return categories.find((category) => category.id === id);
}

/** Parent id for rollup: a child's parent, otherwise itself. */
export function rootIdFor(category: CategoryNode): string {
  return category.parentId ?? category.id;
}

export function childrenOf(
  categories: CategoryNode[],
  parentId: string
): CategoryNode[] {
  return categories
    .filter((category) => category.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function rootsOf(categories: CategoryNode[]): CategoryNode[] {
  return categories.filter(isRoot).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter ids for the Expenses table.
 * Parent → parent + children. Child → itself. Unknown → [id].
 */
export function categoryFilterIds(
  categories: CategoryNode[],
  selectedId: string | undefined
): string[] | undefined {
  if (!selectedId) return undefined;
  const selected = findCategory(categories, selectedId);
  if (!selected) return [selectedId];
  if (selected.parentId) return [selected.id];
  return [selected.id, ...childrenOf(categories, selected.id).map((child) => child.id)];
}

export function categoryPathLabel(
  categories: CategoryNode[],
  categoryId: string
): string {
  const category = findCategory(categories, categoryId);
  if (!category) return "";
  if (!category.parentId) return category.name;
  const parent = findCategory(categories, category.parentId);
  return parent ? `${parent.name} · ${category.name}` : category.name;
}

export function rollupSpendToParents<T extends { categoryId: string; amountMinor: number }>(
  rows: T[],
  categories: CategoryNode[]
): Array<{ categoryId: string; name: string; amountMinor: number }> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const category = findCategory(categories, row.categoryId);
    const id = category ? rootIdFor(category) : row.categoryId;
    totals.set(id, (totals.get(id) ?? 0) + row.amountMinor);
  }
  return [...totals.entries()]
    .map(([categoryId, amountMinor]) => {
      const category = findCategory(categories, categoryId);
      return { categoryId, name: category?.name ?? categoryId, amountMinor };
    })
    .sort((a, b) => b.amountMinor - a.amountMinor);
}
