# Requirements: Mobile Projects Layout, Add Sheet, and Details Expand

- Work item: specs/mobile-projects-layout/
- Outcome: On small viewports only, redesign Projects to match the owner mobile references (unified summary, funding progress list, All projects with + Add project bottom sheet, expandable project Details) while desktop Projects and project math remain unchanged.
- Branch: feature/mobile-projects-layout
- Status: Specification
- Spec version: 2026-08-04

## Problem

On mobile, Projects still uses two separate summary cards, a Recharts funding chart, an always-visible inline Add project form, and project cards that show most fields at once. The owner wants a phone-first layout: one summary card, a simpler Funding progress list, **+ Add project** opening a bottom sheet, and project cards that collapse detail until **Details** is expanded.

## In scope

- Mobile-only (`md` and below) Projects presentation aligned with:
  - `reference-projects-list.png`
  - `reference-add-project-sheet.png`
  - `reference-project-details-expanded.png`
- Unified summary card: Active projects (“N of M”), Left after savings, helper copy about priority taking up to 70%.
- Funding progress card: title/subtitle; per-project name + percent + horizontal bar (currencies not combined)—presentation may be a compact list rather than the desktop Recharts chart.
- “All projects” header with green **+ Add project**; hide inline `AddProjectForm` on mobile; open it in a bottom sheet.
- Project cards: priority badge, name, affordability/status badge, saved/cost + percent + bar; **Details** / **Hide details** expands Currency, Allocation, Period, Goal date, Expected this month (and link when present); reorder ↑↓; Edit / Mark completed / Delete when expanded (or as in reference).
- Desktop (`md+`) Projects layout unchanged (inline Add form + existing cards + Recharts chart).
- No new npm dependencies.

## Out of scope

- Desktop Projects redesign.
- Changing waterfall allocation, priority rules, Prisma schema, or auth.
- Redesigning bottom nav or other routes.
- New modal libraries or fonts.

## Definitions

- **Mobile Projects**: Authenticated `/projects` below the `md` breakpoint.
- **Add project sheet**: Bottom sheet hosting the create-project form.
- **Details**: Local expand/collapse on a project card revealing the detail grid and actions shown in the expanded reference.
- **References**: PNGs under `specs/mobile-projects-layout/`.

## Requirements

### R1 — Mobile Projects layout; desktop unchanged

- Trigger: User opens `/projects` at ~375px vs `md+`.
- Preconditions: `getProjectsView` succeeds for the authenticated user.
- Actor/system: Projects page + mobile presentation.
- Expected response: Below `md`, show stacked mobile layout (title, unified summary, Funding progress, All projects list). At `md+`, keep current desktop structure (two summary cards, `ProjectProgressChart`, inline Add form, card grid).
- State change: Presentation only.
- Visible/resulting evidence: Same project counts, leftover amount, and per-project figures across breakpoints.
- Failure behavior: Prefer existing desktop widgets over a blank page.
- Acceptance evidence: Manual check at ~375px and ≥768px.

### R2 — Unified summary card

- Trigger: Mobile Projects renders.
- Preconditions: View summary available.
- Actor/system: Mobile summary card.
- Expected response: One rounded card with Active projects as “{active} of {total}” and Left after savings (reporting currency), plus helper text that the priority project takes up to 70% of this.
- State change: None.
- Visible/resulting evidence: Matches desktop KPI meaning for the same data.
- Failure behavior: Null leftover uses existing Money empty presentation.
- Acceptance evidence: Spot-check counts and leftover vs desktop.

### R3 — Funding progress card

- Trigger: Mobile Projects renders.
- Preconditions: Project funded percents available where comparable.
- Actor/system: Mobile Funding progress presentation.
- Expected response: Card titled “Funding progress” with subtitle about saved % by project / currencies not combined. Each project with a known percent shows name, percent, and a filled progress bar. Empty/unavailable state when none can be shown.
- State change: None.
- Visible/resulting evidence: Percents match desktop chart data for the same projects.
- Failure behavior: Clear empty copy when no comparable percents.
- Acceptance evidence: Compare listed percents to desktop chart.

### R4 — All projects list chrome + collapsed card

- Trigger: User views All projects on mobile.
- Preconditions: Projects list available.
- Actor/system: Mobile project list + card chrome.
- Expected response: Section “All projects” with green **+ Add project**. Each card shows Priority badge when applicable, name, status/affordability badge, “saved of cost” + funded %, progress bar, Details control, and reorder controls. Collapsed state does **not** dump the full detail grid. Empty list shows clear empty copy.
- State change: Existing reorder/priority/complete/delete actions remain available (details expand may gate some actions per reference).
- Visible/resulting evidence: Matches list reference structure.
- Failure behavior: Empty state does not invent projects.
- Acceptance evidence: Reorder still works; collapsed cards match reference density.

### R5 — Details expand

- Trigger: User activates Details (or Hide details) on a Mobile project card.
- Preconditions: Project card rendered.
- Actor/system: Local expand state on the card.
- Expected response: Expanded section shows Currency, Allocation %, Period (human-readable), Goal date, Expected this month; link when present. Actions Edit, Mark completed (or Reopen), Delete appear as in the expanded reference. Multiple cards may expand independently. Toggle label switches between Details and Hide details.
- State change: Local UI only until an action mutates.
- Visible/resulting evidence: Expanded figures match the same project fields shown on desktop.
- Failure behavior: Missing optional fields show sensible empty (e.g. no goal date).
- Acceptance evidence: Expand/collapse; spot-check fields vs desktop.

### R6 — Add project bottom sheet

- Trigger: User activates + Add project on Mobile Projects.
- Preconditions: `createProjectAction` available.
- Actor/system: Add project sheet + sheet variant of `AddProjectForm`.
- Expected response: Bottom sheet slides up over dimmed backdrop with handle, title “Add project”, close (X). Form fields: name, cost, currency, allocation %, period, goal date, optional link, priority checkbox, submit. Success closes sheet and refreshes list. Validation errors remain in the sheet. Escape / backdrop / X closes without saving. Inline Add form is not shown below `md`.
- State change: Same create persistence as today; local open/close UI state.
- Visible/resulting evidence: New project appears after success; sheet matches reference field layout intent.
- Failure behavior: Invalid submit does not close the sheet.
- Acceptance evidence: Add a project on mobile via the sheet.

### R7 — Security, privacy, dependencies

- Trigger: Implementation and use of Mobile Projects + Add sheet.
- Preconditions: App auth gate.
- Actor/system: Projects mobile UI.
- Expected response: No auth bypass; no new secrets; amounts only via existing display/actions; no new npm dependencies; reference PNGs stay under `specs/`.
- State change: None beyond existing project mutations.
- Visible/resulting evidence: `package.json` deps unchanged for this work.
- Failure behavior: N/A.
- Acceptance evidence: Diff review; logged-out users still redirected.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Responsive Projects redesign from photos | R1–R4 |
| Details expands project information | R5 |
| + Add project opens bottom sheet | R4, R6 |
| Desktop unchanged; no formula/deps expansion | R1, R7 |

## Assumptions

- Funding progress on mobile may be a simple percent bar list (as in the photo) instead of embedding the desktop Recharts vertical bar chart.
- Period labels in Details may use short readable text (e.g. “Both halves”) rather than raw enum.
- Edit may continue to inline-swap the card into `EditProjectForm` when activated from the expanded actions (no separate edit sheet required unless already easy).
- Status badge text continues to use existing affordability/projection strings.

## Open questions

- None blocking.
