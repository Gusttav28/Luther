export interface PlanGroupRow {
  categoryId: string;
  categoryName: string;
  parentId: string | null;
  archived: boolean;
  planned: (number | null)[];
  plannedRaw: number[];
  actual: (number | null)[];
  rowTotal: number | null;
}

export interface PlanGroup<R extends PlanGroupRow = PlanGroupRow> {
  /** Parent row, or an orphaned child whose parent is not in the matrix. */
  root: R;
  children: R[];
  /** Root + children per month; null when any part is unavailable (missing rate). */
  planned: (number | null)[];
  actual: (number | null)[];
  total: number | null;
}

export function sumNullable(values: (number | null)[]): number | null {
  let total = 0;
  for (const value of values) {
    if (value === null) return null;
    total += value;
  }
  return total;
}

function sumByMonth(rows: PlanGroupRow[], pick: (row: PlanGroupRow) => (number | null)[]) {
  return Array.from({ length: 12 }, (_, monthIdx) =>
    sumNullable(rows.map((row) => pick(row)[monthIdx]))
  );
}

/** Groups matrix rows as parent → children, sorted by root name then child name. */
export function groupPlanRows<R extends PlanGroupRow>(rows: R[]): PlanGroup<R>[] {
  const rootIds = new Set(rows.filter((row) => row.parentId === null).map((row) => row.categoryId));
  const roots = rows.filter((row) => row.parentId === null || !rootIds.has(row.parentId));

  return roots
    .map((root) => {
      const children = rows
        .filter((row) => row.parentId !== null && row.parentId === root.categoryId)
        .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      const members = [root, ...children];
      const planned = sumByMonth(members, (row) => row.planned);
      return {
        root,
        children,
        planned,
        actual: sumByMonth(members, (row) => row.actual),
        total: sumNullable(planned),
      };
    })
    .sort((a, b) => a.root.categoryName.localeCompare(b.root.categoryName));
}
