# Requirements: Project leftover covered amount

- Work item: specs/project-leftover-covered/
- Outcome: Projects show only the leftover-based amount covered toward each project and the percentage of cost that represents. That amount moves when leftover moves, the same way Savings shows this month’s leftover take.
- Branch: cursor/project-leftover-covered-ef43
- Status: Specification
- Spec version: 2026-09-21
- Human approval: owner request 2026-09-21 — “Let’s work on this screen now” with leftover-covered display locked

## Problem

The Projects screen (luther-two.vercel.app) shows **₡109,647.15 of ₡60,000.00 — 100% — Affordable now** for MSI Monitor. That numerator is the **lifetime sum of `ProjectContribution` rows**, not the leftover waterfall. Left after savings is **₡4,834.50** and Expected this month is already the correct leftover take (**₡2,417.25** at 50% allocation). The owner does not have 100% of the project funded. Coverage must be the same leftover slice the system already uses for “the amount of money that have to save”: leftover after remaining Planning, 70% to savings, then the project’s allocation % of what is left.

## In scope

- Projects card headline: **covered amount of cost** and **percentage of cost**.
- Covered amount = current leftover **project take** (allocation % of post-lifetime leftover). Not lifetime contributions.
- Percentage = covered take ÷ project cost, capped at 100%.
- Amount and percent **change when leftover changes** (Main changes, Planning remaining changes, charge reduces Main).
- Same leftover figure drives Funding progress bars (Projects page and Overview “Projects funded”).
- “Affordable now” is true only when leftover take ≥ cost (not when lifetime contributions ≥ cost).
- Affordability projection starts from leftover take, not lifetime contributions.
- Unit tests for covered amount / percent / leftover-zero / take-over-cost.
- `requireUserId` / `userId`; no secrets; no new npm packages; no new Prisma models.

## Out of scope

- Changing leftover math (`max(0, mainCash − remainingPlanning)`, 70% savings, project allocation 1–70% of post-lifetime).
- Changing Left after savings / Expected this month formulas (Expected this month is already leftover take).
- Deleting `ProjectContribution` rows or stopping month materialize.
- Showing a lifetime contribution history list on Projects.
- Multi-project simultaneous funding (still one priority take).
- New dependencies or schema migrations.

## Definitions

- **Leftover**: `max(0, mainCash − remainingPlanning)`.
- **Savings take**: `floor(70% of leftover)` — the amount Savings already shows.
- **Post-lifetime leftover / Left after savings**: leftover − savings take (the 30% remainder).
- **Project take / covered amount**: `floor(allocationPercent % of post-lifetime leftover)` for the active priority project; **0** for non-priority and completed projects. Same number as Expected this month for the priority project.
- **Covered percent**: `min(100, round(project take ÷ cost × 100))` in the project’s currency. Missing FX → null / “—”.
- **Displayed covered**: `min(project take, cost)` so the “X of Y” line never shows more than cost.

## Requirements

### R1 — Headline covered amount is leftover project take

- Trigger: Owner opens `/projects` (desktop and mobile).
- Preconditions: Human-approved spec. Waterfall leftover already exists.
- Actor/system: `getProjectsView` and project cards.
- Expected response: Each card shows **covered of cost**, where covered is leftover project take (R definitions), not `ProjectContribution` lifetime sum. Screenshot lock: leftover after savings ₡4,834.50, allocation 50% → covered **₡2,417.25 of ₡60,000.00**, not ₡109,647.15 of ₡60,000.00.
- State change: None on read.
- Visible/resulting evidence: Mobile “X of Y” and desktop Saved/covered line use leftover take. Lifetime lump is not the headline.
- Failure behavior: Missing FX → null / “—” for that project, not a coerced 0 from mixed currencies.
- Acceptance evidence: `savedMinor` (covered) equals `expectedTakeMinor` converted to the project currency for the priority project. Grep: contribution `groupBy` is not the source of `savedMinor` / `fundedPercent`.

### R2 — Percentage is covered ÷ cost

- Trigger: Same view; Funding progress on Projects; Overview Projects funded.
- Expected response: Percent = `min(100, round(take / cost × 100))`. Screenshot lock: 241725 / 6000000 → **4%**, not 100%. Cost 0 or null take → “—”.
- Visible/resulting evidence: Card percent, progress bar width, Funding progress list, Overview bars, desktop chart all use this percent.
- Acceptance evidence: Unit tests for 4%, 0%, 100% cap.

### R3 — Covered amount moves when leftover moves

- Trigger: Main cash changes, remaining Planning changes, or an expense is marked Already charged (Main drops).
- Expected response: Recalculate leftover → savings 70% → project take. Covered amount and percent update on refresh the same way Savings take updates. Leftover 0 → covered 0 and 0%.
- State change: None beyond existing charge-reduces-Main / waterfall revalidation.
- Visible/resulting evidence: After leftover falls, MSI Monitor covered falls; after leftover rises, covered rises.
- Acceptance evidence: Helper tests: take 0 → 0 / 0%; take follows `computeWaterfall` `projectTakeMinor`.

### R4 — Affordable now and projection use leftover take

- Trigger: Owner views a project badge / projection.
- Expected response: **Affordable now** only when leftover take ≥ cost. Projection `savedMinor` input is leftover take (reporting currency), not lifetime contributions. Non-priority stays “funding paused”. Completed stays Completed.
- Visible/resulting evidence: Screenshot case is **not** Affordable now (₡2,417.25 < ₡60,000).
- Acceptance evidence: Code review of `getProjectsView` projection inputs; unit test take < cost → not affordable; take ≥ cost → affordable.

### R5 — Auth, privacy, dependencies

- Trigger: All changed loaders.
- Expected response: `requireUserId`; queries stay `userId`-scoped; no secrets; `package.json` unchanged; no new Prisma models.
- Acceptance evidence: Diff review.

## Traceability

| Source request | Requirement IDs |
| --- | --- |
| Show only leftover-covered amount + percent of cost | R1, R2 |
| Amount changes with money left (same as savings take) | R3 |
| Stop showing 100% / Affordable now from lifetime contributions | R1, R2, R4 |
| Security / no new packages | R5 |

## Assumptions

- Expected this month remains on the details panel; it is already leftover take and will match the headline for the priority project.
- `ProjectContribution` materialize may keep writing history; it is not shown as coverage.
- Non-priority and completed projects show covered **₡0** and **0%** (they are not the active take).
- Displayed “X of Y” caps X at cost when take exceeds cost; percent still uses take ÷ cost capped at 100%.

## Open questions

None blocking. Behavior is locked by the owner’s Projects screenshot and the leftover/savings rule already on `main`.
