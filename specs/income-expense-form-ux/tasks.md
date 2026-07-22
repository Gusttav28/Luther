# Tasks: Income/expense form UX polish

## Implementation checklist

- [ ] T1 — Align Add income Label field with Period / Amount / Currency
  - Files: `app/(app)/income/income-forms.tsx`
  - Requirements: R1
  - Preconditions: Spec approved
  - Expected evidence: Desktop Add income row has consistent vertical alignment

- [ ] T2 — Expense category dropdown of existing categories (+ new-category path)
  - Files: `components/category-picker.tsx`, `app/(app)/expenses/expense-forms.tsx` (if needed)
  - Requirements: R2, R4
  - Preconditions: T1 optional parallel
  - Expected evidence: Dropdown lists active categories; new category still creatable

- [ ] T3 — Expenses table half-month filter beside total
  - Files: `app/(app)/expenses/page.tsx`
  - Requirements: R3, R4
  - Preconditions: Spec approved
  - Expected evidence: All / H1 / H2 controls next to total; list + total filtered; URL `period` param

## Verification

- [ ] TV1 — Visual check `/income` at ≥640px width
  - Covers: R1
  - Expected result: Label column aligned with other three fields

- [ ] TV2 — Manual `/expenses` category dropdown + create new
  - Covers: R2
  - Expected result: Existing names in select; new name still saves a category

- [ ] TV3 — Manual half filter with expenses before and after the 15th
  - Covers: R3
  - Expected result: H1/H2 change list and total; invalid period ignored

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1 |
| T2 | R2, R4 |
| T3 | R3, R4 |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
