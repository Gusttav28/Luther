# Requirements: Percentage savings waterfall & Supabase

- Work item: specs/percentage-savings-projects/
- Outcome: Lifetime savings and project funding are percentage-driven from leftover budget after expenses; priority project is funded from the post-lifetime remainder; app database moves to Supabase Postgres.
- Branch: `feature/percentage-savings-projects`
- Status: Specification (awaiting human approval)
- Spec version: 2026-07-21

## Problem

Today Luther records lifetime savings as manual contribution amounts and funds projects with a fixed per-period allocation amount. The owner’s real process is a waterfall from planned income → expenses → leftover → fixed 70% lifetime savings → remainder → up to 70% of that remainder to the single priority project. The app must encode that process and persist data in Supabase Postgres instead of local SQLite.

## In scope

- Lifetime savings derived as **always 70%** of budget left after expenses (from planned income).
- Project create/edit: name, cost, allocation **percentage** (of post-lifetime leftover), period mode (H1 / H2 / both), goal date, and **priority** flag (exactly one active priority project).
- Hard cap: project allocation percentage ≤ **70%** of the post-lifetime leftover; any value from 1–70% allowed.
- Multiple projects may exist with their own percentages and goal dates; only the marked priority project is the committed funding target.
- Derived / projected amounts computed from existing income and expense data (no manual “contribution amount” required for the normal waterfall).
- Migrate persistence from SQLite to **Supabase Postgres** via Prisma; keep Auth.js credentials auth unless a later work item changes it.
- Update Savings and Projects UI to match the new model; overview “saved” / remaining figures follow the waterfall.

## Out of scope

- Changing Auth.js to Supabase Auth (may follow later).
- Client-side use of the Supabase service-role key.
- Multi-user collaboration or shared households.
- Auto-transfer to bank accounts.
- Changing expense/income entry UX except where totals feed this waterfall.
- Rebuilding unrelated analytics/layout work.

## Definitions

- **Planned income (month)**: sum of planned income entries for the month (H1 + H2) in reporting currency.
- **Budget left after expenses**: planned income − expenses for the same scope (month or selected half, per design).
- **Lifetime savings take**: always **70%** of budget left after expenses.
- **Post-lifetime leftover**: the remaining **30%** after the lifetime take.
- **Project allocation %**: percentage of the **post-lifetime leftover** assigned toward a project; hard maximum **70%**.
- **Priority project**: the single active project the owner commits to fund next; other projects may be planned but are not the active funding target.
- **Period mode**: whether a project’s % applies in H1, H2, or both halves.

## Requirements

### R1 — Waterfall: budget left after expenses

- Trigger: user views savings, projects, or overview figures that depend on leftover budget.
- Preconditions: planned income and expenses exist for the selected month (missing pieces yield clear empty/partial states).
- Actor/system: system.
- Expected response: compute budget left = planned income − expenses (reporting currency), never inventing income.
- State change: none (derived).
- Visible/resulting evidence: leftover amount shown where the waterfall is presented.
- Failure behavior: if FX rate missing for a needed conversion, show the existing rate-needed message; do not silently assume a rate.
- Acceptance evidence: unit tests with CRC examples matching the owner’s walkthrough (e.g. income 200_000, expenses known → leftover correct).

### R2 — Lifetime savings fixed at 70%

- Trigger: waterfall computation for a month/half.
- Preconditions: R1 leftover available (or zero).
- Actor/system: system.
- Expected response: lifetime savings amount = **70%** of budget left after expenses; this percentage is not user-editable in MVP of this work item.
- State change: derived lifetime figure; optional persistence of computed period snapshots only if design requires audit rows (see design).
- Visible/resulting evidence: Savings page and overview “saved” reflect this 70% take for the period, not a free-typed contribution amount as the primary path.
- Failure behavior: leftover ≤ 0 → lifetime take = 0.
- Acceptance evidence: tests assert exactly 70% of leftover (integer minor-unit rounding rule documented in design).

### R3 — Post-lifetime leftover and project hard cap

- Trigger: project funding projection or priority allocation.
- Preconditions: R2 computed.
- Actor/system: system + user (choosing %).
- Expected response: post-lifetime leftover = 30% of budget left after expenses; priority project may take **at most 70%** of that leftover; user may choose any integer percent in **1–70** (inclusive).
- State change: project stores `allocationPercent` (1–70).
- Visible/resulting evidence: project form rejects > 70; UI explains leftover after lifetime and max take.
- Failure behavior: validation error if percent outside 1–70.
- Acceptance evidence: form validation + unit tests for cap.

### R4 — Priority project (single commit target)

- Trigger: user marks a project as priority, or views funding.
- Preconditions: at least one incomplete project optional.
- Actor/system: user.
- Expected response: at most **one** non-completed project is priority; marking another clears the previous; funding/projections for “what I’m committing to now” use the priority project’s % only.
- State change: `isPriority` (or equivalent) on Project; uniqueness enforced per user among active projects.
- Visible/resulting evidence: Projects list shows which is priority; only that one drives the active commitment calculation.
- Failure behavior: attempting two priorities resolves to one (last write wins) with clear UI.
- Acceptance evidence: action/integration test for single-priority invariant.

### R5 — Project fields: cost, %, period, goal date

- Trigger: create or edit project.
- Preconditions: authenticated owner.
- Actor/system: user.
- Expected response: project requires name, cost (+ currency), allocation percent (R3), period mode (`H1` | `H2` | `BOTH`), and goal date; remove fixed global per-period allocation amount as the funding model.
- State change: Project rows updated; `AllocationSetting` fixed-amount model retired or unused.
- Visible/resulting evidence: Projects UI matches these fields (no primary “allocate fixed CRC per half” control).
- Failure behavior: missing/invalid fields rejected with field errors.
- Acceptance evidence: UI + server validation tests.

### R6 — Derived amounts from income & expenses (no manual amount primary path)

- Trigger: income/expenses change, or user opens Savings/Projects/Overview.
- Preconditions: R1–R5.
- Actor/system: system.
- Expected response: lifetime and priority-project expected amounts are **computed** from income & expenses via the waterfall; user does not need to type the contribution amount for the normal path.
- State change: optional snapshot/ledger rows if design keeps history; otherwise pure derivation is acceptable if balance still auditable.
- Visible/resulting evidence: changing an expense recalculates expected lifetime/project takes on refresh.
- Failure behavior: incomplete month data shows partial/zero with explanation.
- Acceptance evidence: scenario test: income + expenses → lifetime 70% → project take = min(user%, 70%) of post-lifetime leftover.

### R7 — Supabase Postgres as system of record

- Trigger: deploy/dev against shared DB.
- Preconditions: Supabase project credentials in `.env` (never committed).
- Actor/system: implementer / ops.
- Expected response: Prisma datasource uses Postgres (`DATABASE_URL`, and `DIRECT_URL` for migrations if using pooler); schema migrated to Supabase; app reads/writes there.
- State change: data lives in Supabase; local SQLite no longer the primary store for this branch.
- Visible/resulting evidence: `prisma migrate` succeeds against Supabase; app login and CRUD work against remote DB.
- Failure behavior: missing/invalid DB URL fails fast with clear message (existing env pattern).
- Acceptance evidence: documented connection steps; migrate + smoke login against Supabase.

### R8 — Secrets hygiene

- Trigger: any env or client bundle change.
- Preconditions: none.
- Actor/system: implementer.
- Expected response: service-role key and DB password never shipped to the browser; only publishable URL/key may be `NEXT_PUBLIC_*` if needed; `.env` stays gitignored; `.env.example` has placeholders only.
- State change: none.
- Visible/resulting evidence: no secrets in git; client bundle grep clean for service role / DB password.
- Failure behavior: N/A.
- Acceptance evidence: review checklist + `git` check that `.env` is ignored.

### R9 — Manual withdrawal / adjustment escape hatch

- Trigger: user needs to correct lifetime balance outside the waterfall.
- Preconditions: authenticated owner.
- Actor/system: user.
- Expected response: keep a minimal manual adjustment path (withdrawal/contribution) so lifetime balance can be corrected, without replacing the primary 70% waterfall.
- State change: optional `SavingsContribution` adjustment rows.
- Visible/resulting evidence: adjustments still cannot drive lifetime balance below zero (existing rule).
- Failure behavior: same as current negative-balance rejection.
- Acceptance evidence: existing withdrawal guard still passes.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Income → expenses → leftover → 70% lifetime | R1, R2 |
| From remaining 30%, project max 70%, any lower % OK | R3, R6 |
| Multiple projects; one priority commit | R4, R5 |
| Auto-derived from income/expenses | R6 |
| Period / goal date on projects | R5 |
| Supabase credentials / remote DB | R7, R8 |
| Manual correction still possible | R9 |

## Open questions

None blocking for specification. Implementer must paste the **exact** Supabase Postgres connection strings from the dashboard into `.env` (`DATABASE_URL` / `DIRECT_URL`) — project ref and password are already on hand locally; host/pooler URL must match the project region.

## Human approval gate

Do not implement until the human owner explicitly approves this spec package (`requirements.md`, `design.md`, `tasks.md`).
