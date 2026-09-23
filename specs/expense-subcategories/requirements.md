# Requirements: Expense subcategories

- Work item: specs/expense-subcategories/
- Outcome: Each expense category can have optional subcategories. The owner sees general spend on the parent (Subscriptions, Supermarkets) and can open a dropdown to filter or record against a child (TV, AI, protein).
- Branch: cursor/expense-subcategories-ef43
- Status: Specification
- Spec version: 2026-09-23
- Human approval: owner request 2026-09-23 — add subcategory under Expenses with table dropdown

## Problem

Expenses today are a flat list of categories. The owner already thinks in two levels: a **main** category (Subscriptions, Supermarkets) and **types** under it (TV / AI / cloud tools; protein / carbs). The table can only filter the whole category. They need general spend on the parent **and** a dropdown to open each subcategory.

This is not a request to hardcode Netflix or Cursor. The owner creates the names. Existing categories stay roots.

## In scope

- One extra level only: parent → children. No grandchildren.
- Create, rename, archive, delete subcategories (same rules as categories).
- Expense create/edit: pick a parent, then General (parent itself) or a subcategory, or type a new subcategory under that parent.
- Expenses table: parent chips / mobile select. Parent = general (parent + all children). Dropdown / optgroup to click a child.
- Expense row shows `Parent · Child` when assigned to a child.
- Composition donut and Overview spent-by-category **roll up** to the parent so Subscriptions is one general slice.
- Plan category list can add a subcategory under a parent; matrix rows indent children.
- Prisma: optional `Category.parentId`. One new migration. No new npm packages.
- `requireUserId` / `userId`; no secrets.

## Out of scope

- Seeding Netflix, HBO, Cursor, or any owner-specific names.
- More than two levels.
- Changing leftover / savings / projects math.
- Auto-splitting a parent’s historical expenses into children.
- New Plan formulas beyond indenting child rows.

## Definitions

- **Parent / main category**: `parentId` is null (Subscriptions, Supermarkets).
- **Subcategory / child**: `parentId` points at a parent. One level only.
- **General**: filter or assignment on the parent. Filter includes the parent row **and** all of its children. Assignment to General stores `categoryId` = parent.
- **Child filter**: expenses whose `categoryId` is that child only.
- **Path label**: `Parent · Child` for a child; parent name alone for a parent.

## Requirements

### R1 — Parent/child category model

- Trigger: create or load categories.
- Preconditions: authenticated owner.
- Actor/system: Category rows.
- Expected response: optional `parentId`. Parent must be a root owned by the same user. A child cannot have children. Names stay unique per user (`userId` + `name`). Existing rows remain parents (`parentId` null).
- State change: new column + migration. No new Prisma models.
- Failure behavior: reject child-of-child; reject parent on another user’s category.
- Acceptance evidence: schema + unit tests for the tree helper.

### R2 — Create and manage subcategories

- Trigger: Plan “add subcategory”, or expense picker “New subcategory…”.
- Expected response: child is created under the chosen parent. Rename / archive / delete use existing actions with `userId`. Delete parent is blocked while it has children. Delete child is blocked while it has expenses (archive instead), same as today.
- Visible/resulting evidence: Plan list nests children under the parent. Category picker lists children under the parent.
- Acceptance evidence: create action accepts `parentId`; delete parent with children returns an error.

### R3 — Record an expense on parent or child

- Trigger: add or edit expense.
- Expected response: pick parent, then General or a child. New subcategory name is created under that parent. Stored `categoryId` is the parent (General) or the child.
- Visible/resulting evidence: list row shows path label.
- Failure behavior: missing category still “Choose or type a category name”.
- Acceptance evidence: `resolveCategoryId` with `parentId` creates a child; without `parentId` creates a root.

### R4 — Expenses table: general + subcategory dropdown

- Trigger: `/expenses` category filter (desktop chips, mobile select).
- Expected response: **All** unchanged. Each **parent** chip/option is general spend (parent + children). A dropdown (desktop) or optgroup (mobile) lists that parent’s children to click. Selecting a child filters to that child only. Table total and list match the filter.
- Visible/resulting evidence: Subscriptions general shows TV + AI + unsplit Subscriptions rows; choosing AI shows only AI.
- Acceptance evidence: `categoryFilterIds(parent)` = `[parent, ...children]`; `categoryFilterIds(child)` = `[child]`. UI has the dropdown/optgroup.

### R5 — Rolled-up composition

- Trigger: Expenses donut (unfiltered) and Overview spent-by-category.
- Expected response: amounts for children add into the parent slice. When the Expenses page is filtered to one parent, the donut may show that parent’s children (plus General).
- Acceptance evidence: helper / snapshot rollup test: parent 10 + child 20 → parent slice 30.

### R6 — Auth, privacy, dependencies

- Trigger: all changed loaders and actions.
- Expected response: `requireUserId`; every Category/Expense query stays `userId`-scoped; parent lookup must match `userId`. `package.json` unchanged except Prisma client generate. No secrets.
- Acceptance evidence: diff review.

## Traceability

| Source request | Requirement IDs |
| --- | --- |
| Main category + types under it (Subscriptions → TV/AI; Supermarkets → protein/carbs) | R1, R2, R3 |
| General spend on the parent | R4, R5 |
| Dropdown to open subcategories on the table | R4 |
| Owner creates the names (not hardcoded) | R2, R3 |
| Security / approved schema only | R1, R6 |

## Assumptions

- The owner’s current four categories become parents automatically.
- They add as many parents and children as they want; “two categories” means the second level, not two seeded names.
- Plan cells stay per `categoryId` (parent or child). Child rows indent under the parent.

## Open questions

None blocking. Behavior is locked by the owner’s Expenses walkthrough.
