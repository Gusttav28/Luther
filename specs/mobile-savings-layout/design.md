# Design: Mobile Lifetime Savings Layout and Record Sheet

- Governing requirements: R1, R2, R3, R4, R5, R6

## Goals

- Mobile Savings IA matching owner references (R1–R4).
- Manual record via bottom sheet from + Record (R5).
- Preserve savings semantics and avoid new deps (R6).

## Current system observations

- `app/(app)/savings/page.tsx` — four KPI cards, explainer, bar + donut, inline `AddSavingsForm`, History list.
- `app/(app)/savings/savings-forms.tsx` — create/update/delete; amount may be negative for withdrawals.
- Chart helpers already support `embedded`/`compact` from prior mobile work.
- Income/Expenses sheets establish the bottom-sheet interaction pattern to reuse structurally.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/savings/page.tsx` | Split mobile vs desktop; pass summary/chart/history props into mobile composition. | R1–R5 |
| `app/(app)/savings/savings-forms.tsx` | `AddSavingsForm` sheet variant + `onSuccess`; optional mobile history row chrome. | R4, R5 |
| `components/charts/bar-chart.tsx` / `donut-chart.tsx` | Reuse existing embedded/compact props (no change unless needed). | R3 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `components/savings/mobile-savings.tsx` | Mobile stacked layout: summary, charts, History + Record trigger. | R1–R4 |
| `components/add-savings-sheet.tsx` (or under savings/) | Client bottom sheet hosting sheet-variant `AddSavingsForm`. | R5 |

## Data and control flow

```
savings/page.tsx (server)
  getSavings + trend/totals (unchanged)
        │
        ├─► Desktop (md+): existing layout + inline AddSavingsForm
        │
        └─► MobileSavings (md:hidden)
              Summary card (4 KPIs + explainer)
              BarChart embedded
              DonutChart embedded
              History card
                + Record → open AddSavingsSheet
                    AddSavingsForm(variant=sheet) → createSavingsAction
                    onSuccess → close + refresh
              SavingsListRow edit/delete (existing actions)
```

### Visual notes

- Cards ~20px radius; stacked ~18px gaps.
- + Record: text button, brand/green, top-right of History.
- Sheet: scrim, rounded top, handle, X, full-width submit (match Income/Expenses sheets).
- History rows: note + date left; amount; Edit/Delete (may stack on very narrow widths).

## Validation and failure handling

- Reuse action-state errors inside the sheet.
- Closing discards unsaved draft.
- Pending submit via existing `PendingSubmitButton`.

## Security, privacy, accessibility, and performance

- Auth unchanged.
- + Record and sheet close controls have accessible names.
- Focus into sheet on open; Escape closes.
- No new dependencies.

## Dependencies

- **No new npm dependencies.**

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep inline manual form on mobile | Rejected | Owner requires + Record → bottom sheet |
| Change 70% calculation UX | Rejected | Out of scope |
| New modal library | Rejected | No new deps; fixed overlay pattern sufficient |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | page split + MobileSavings |
| R2 | summary card |
| R3 | stacked charts |
| R4 | History + + Record |
| R5 | AddSavingsSheet |
| R6 | no new deps; auth unchanged |
