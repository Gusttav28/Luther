# Design: Mobile Income Layout and Add Sheet

- Governing requirements: R1, R2, R3, R4, R5, R6

## Goals

- Deliver mobile Income IA matching the owner references (R1, R5).
- Add income via bottom sheet opened by a + FAB (R2, R3, R4).
- Preserve create/edit/delete semantics and avoid new deps (R6).

## Current system observations

- `app/(app)/income/page.tsx` — `MonthPicker`, inline `AddIncomeForm`, donut, three total cards, two half sections with `IncomeEntryRow`.
- `app/(app)/income/income-forms.tsx` — create/update/delete via actions; period select, amount, currency, label, planned.
- `components/month-picker.tsx` — already has `variant="circles"`.
- Expenses sheet pattern (`components/add-expense-sheet.tsx`) is a useful structural reference; Income sheet should be Income-scoped (not reuse the Expenses N flow).

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/income/page.tsx` | Split mobile vs desktop; wire mobile summary + schedule; hide inline add/donut below `md`; mount FAB + sheet host. | R1, R2, R4, R5 |
| `app/(app)/income/income-forms.tsx` | `AddIncomeForm` sheet variant (segmented H1/H2, denser fields, full-width submit, `onSuccess`); keep card variant for desktop. | R2, R3 |
| `components/month-picker.tsx` | Reuse `circles` on mobile Income header (no API change required if already present). | R1 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `components/add-income-sheet.tsx` (or under `app/(app)/income/`) | Client bottom sheet + open state + optional FAB wrapper for Mobile Income. | R2, R3, R4 |
| `components/income/mobile-income.tsx` (optional) | Mobile layout composition (header, summary strip, schedule). | R1, R5 |

Exact filenames may vary; responsibilities must exist.

## Data and control flow

```
Income page (server)
  getIncomeForMonth → totals + entries
        │
        ├─► Desktop (md+): existing AddIncomeForm + Donut + cards + lists
        │
        └─► Mobile (<md):
              MonthPicker(circles)
              Summary strip (H1 / H2 / Month)
              Half-month schedule (H1, H2 lists)
              + FAB → open AddIncomeSheet
                    AddIncomeForm(variant=sheet) → createIncomeAction
                    onSuccess → close + refresh
```

### Visual notes

- Summary: one rounded card, three columns; Month total emphasized (brand/green).
- Schedule: one card titled “Half-month schedule” / “Income entries by period”; H1/H2 blocks; Current chip when applicable; empty → “No entries yet.”
- FAB: `fixed` bottom-end, brand fill, `+` icon, above/clear of bottom nav (`z` below sheet, above content).
- Sheet: same interaction model as expense sheet (scrim, rounded top, handle, X, Escape).

## Validation and failure handling

- Reuse action-state errors in the sheet.
- Closing discards unsaved draft.
- Pending submit via existing `PendingSubmitButton`.

## Security, privacy, accessibility, and performance

- Auth unchanged.
- FAB and sheet controls have accessible names; period segmented control exposes selected state.
- Focus moves into sheet on open; Escape closes.
- No new dependencies.

## Dependencies

- **No new npm dependencies.**

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Reuse Expenses **N** for Add income | Rejected | Owner wants Income-page + FAB |
| Keep inline add on mobile | Rejected | Owner requires bottom sheet |
| Drop currency from sheet | Rejected | Financial correctness |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | page split + mobile layout / MonthPicker circles |
| R2 | sheet-hosted AddIncomeForm |
| R3 | AddIncomeSheet chrome |
| R4 | Income + FAB |
| R5 | schedule lists + existing rows |
| R6 | no new deps; auth unchanged |
