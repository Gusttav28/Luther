# Design: Mobile Projects Layout, Add Sheet, and Details Expand

- Governing requirements: R1, R2, R3, R4, R5, R6, R7

## Goals

- Mobile Projects IA matching owner references (R1–R4).
- Expandable Details per project (R5).
- Add project via bottom sheet from + Add project (R6).
- Preserve project/waterfall semantics and avoid new deps (R7).

## Current system observations

- `app/(app)/projects/page.tsx` — two summary cards, `ProjectProgressChart`, inline `AddProjectForm`, `ProjectCard` grid.
- `app/(app)/projects/project-forms.tsx` — create/update/delete/complete/move/priority; cards show most fields always (no Details toggle).
- Income/Expenses/Savings sheets establish the bottom-sheet pattern to reuse.
- `getProjectsView` already supplies saved/funded/expected/affordability fields.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `app/(app)/projects/page.tsx` | Split mobile vs desktop; pass view props into mobile composition. | R1–R6 |
| `app/(app)/projects/project-forms.tsx` | `AddProjectForm` sheet variant + `onSuccess`; mobile-friendly `ProjectCard` (or extracted mobile card) with Details expand + collapsed chrome. | R4–R6 |
| `components/charts/project-progress-chart.tsx` | Optional `embedded`/`compact` or leave desktop-only; mobile may use a simple list instead. | R3 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `components/projects/mobile-projects.tsx` | Mobile stack: summary, funding progress list, All projects + Add trigger, project cards. | R1–R5 |
| `components/add-project-sheet.tsx` | Client bottom sheet hosting sheet-variant `AddProjectForm`. | R6 |

## Data and control flow

```
projects/page.tsx (server)
  getProjectsView + settings (unchanged)
        │
        ├─► Desktop (md+): existing layout + inline AddProjectForm + ProjectProgressChart
        │
        └─► MobileProjects (md:hidden)
              Summary card (active of total + left after savings)
              Funding progress (name / % / bar list)
              All projects
                + Add project → open AddProjectSheet
                    AddProjectForm(variant=sheet) → createProjectAction
                    onSuccess → close + refresh
              ProjectCard (mobile chrome)
                collapsed: badges, progress, Details, reorder
                expanded: detail grid + Edit / Complete / Delete
```

### Visual notes

- Cards ~20px radius; stacked ~18px gaps.
- + Add project: text button, brand/green, top-right of All projects.
- Priority badge: dark brand pill; status badge: soft brand/muted pill (e.g. Affordable now).
- Priority cards: subtle brand ring/border as today.
- Details / Hide details: text + chevron; expand reveals 2-column meta grid.
- Reorder: circular secondary ↑↓ buttons.
- Sheet: scrim, rounded top, handle, X, full-width dark submit (match Add income/expense sheets + reference).

## Validation and failure handling

- Reuse action-state errors inside the sheet.
- Closing discards unsaved draft.
- Pending submit via existing `PendingSubmitButton`.

## Security, privacy, accessibility, and performance

- Auth unchanged.
- + Add project, Details, and sheet close controls have accessible names / `aria-expanded` on Details.
- Focus into sheet on open; Escape closes.
- No new dependencies.

## Dependencies

- **No new npm dependencies.**

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep inline Add form on mobile | Rejected | Owner requires + Add project → bottom sheet |
| Always-expanded card details | Rejected | Owner requires Details expand |
| Keep Recharts chart on mobile | Optional reject | Photo shows simple percent bars; list is clearer on phone |
| New modal library | Rejected | No new deps |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | page split + MobileProjects |
| R2 | summary card |
| R3 | funding progress list |
| R4 | All projects + collapsed cards |
| R5 | Details expand |
| R6 | AddProjectSheet |
| R7 | no new deps; auth unchanged |
