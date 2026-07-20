# Requirements: Finance App MVP

- Work item: specs/finance-app-mvp/
- Outcome: A secure, mobile-friendly personal finance web application that replaces the owner's Excel workbook (monthly overview, half-month income, dual-currency expenses, category budget plan, running balance, and purchase projects).
- Branch: feature/finance-app-mvp
- Status: Specification (approved by the human owner on 2026-07-20, conditional on validation against the reference Excel workbook, which is still pending delivery — see Open questions)
- Spec version: 2026-07-20 v2

## Problem

Gustavo currently manages personal finances in an Excel workbook with six sheets (overview/review, income operations, expenses, general category plan, balance, and purchase projects). The workbook is manual, error-prone, not mobile-friendly, and cannot evolve toward planned future capabilities (email bill ingestion, AI financial assistant). Luther must replicate the workbook's model as a secure web application usable on a phone, for a single user initially.

## In scope

- Single-user credential-based authentication protecting all financial data.
- Planned and actual income recorded per half-month period (first half: days 1–15; second half: day 16–end of month).
- Expense recording in two currencies (USD and MXN) with user-controlled exchange rates (USD→CRC and MXN→CRC) so totals can be shown in a single reporting currency (default CRC).
- Lifetime (general) personal savings: recorded contributions accumulating into a long-term savings balance, surfaced on the monthly overview.
- Spending categories and a category-by-month budget plan matrix for a calendar year, with per-category row totals and per-month column totals.
- A monthly overview computing earned, spent, saved, and remaining amounts for a selected month.
- A running balance derived from income, expenses, and an editable starting balance.
- Purchase projects (goal items with a cost) with a fixed-amount savings allocation per half-month period, a per-project accumulated saved total, and a projected date by which each project becomes affordable.
- Responsive web UI usable on a phone browser.
- Input validation, error handling, and basic operational hygiene (no secrets in the repository).

## Out of scope

- Email integration / automatic ingestion of bills and receipts (future).
- AI assistant, monthly AI summaries, or savings recommendations (future).
- Bank/API integrations, automatic transaction import, or live exchange-rate feeds.
- Multi-user support, sharing, or client accounts (future; architecture must not preclude it).
- Native mobile apps (responsive web only).
- Data import from the Excel workbook (may be a follow-up work item once the workbook is provided).
- Notifications, reminders, or scheduled jobs.

## Definitions

- Half-month period (H1/H2): H1 = days 1–15 of a month; H2 = day 16 through the last day of the month. Income and project savings allocations are planned per period.
- Reporting currency: the single currency (CRC, USD, or MXN, user-selectable; default CRC — Costa Rican colón, ₡) in which aggregated totals are displayed. Amounts in other currencies are converted using the stored exchange rates.
- Exchange rates: manually maintained USD→CRC and MXN→CRC rates stored in app settings; conversions among CRC/USD/MXN derive from these two rates; no external rate feed in MVP.
- Lifetime savings: the owner's long-term general personal savings balance, built from explicit contributions; distinct from per-project savings. The overview's "saved" figure is the month's lifetime savings contributions.
- Project savings: the amount accumulated specifically toward one project via its per-period allocations; tracked per project, separate from lifetime savings.
- Category plan: a matrix of spending categories (rows) by months of a year (columns) holding planned amounts, with row totals per category and column totals per month.
- Project: a desired purchase with a name and cost, funded by a per-period savings allocation until affordable.

## Requirements

### R1 — Credential-based authentication

- Trigger: any request to an application page or API.
- Preconditions: a single owner account exists (created by a documented bootstrap step, e.g., seed script or first-run setup; credentials never committed).
- Actor/system: unauthenticated visitor; auth middleware/session layer.
- Expected response: unauthenticated requests are redirected to a login page; valid credentials establish a session; logout ends the session.
- State change: session created/destroyed; password stored only as a strong salted hash (e.g., bcrypt/argon2).
- Visible/resulting evidence: login page, logout control, protected routes inaccessible without a session.
- Failure behavior: invalid credentials show a generic error (no user enumeration); repeated failures are rate-limited or delayed.
- Acceptance evidence: automated test or documented manual check showing (a) protected route redirects when logged out, (b) login/logout round trip works, (c) password hash — not plaintext — is stored.

### R2 — Financial data protection and secrets hygiene

- Trigger: development, configuration, and operation of the app.
- Preconditions: none.
- Actor/system: repository, application configuration, database.
- Expected response: all secrets (session secret, database credentials, owner bootstrap credentials) come from environment variables; an `.env.example` documents required variables without values; `.gitignore` excludes env files and the local database file; all data access requires the authenticated session (no anonymous API surface).
- State change: none (posture requirement).
- Visible/resulting evidence: repository contains no secrets or personal financial data; session cookies are HttpOnly and SameSite; HTTPS assumed in any non-local deployment.
- Failure behavior: missing required environment variables fail fast at startup with a clear error.
- Acceptance evidence: repository scan shows no committed secrets/data; startup fails cleanly without required env vars; API endpoints return 401/redirect without a session.

### R3 — Income by half-month periods

- Trigger: the user records or edits planned/actual income for a month.
- Preconditions: authenticated session.
- Actor/system: owner; income module.
- Expected response: the user can create, edit, and delete income entries, each assigned to a month, a period (H1 or H2), an amount, a currency (USD or MXN), and an optional label/source; per-period and per-month totals are displayed.
- State change: income entries persisted.
- Visible/resulting evidence: an income view for a selected month showing H1 and H2 entries and totals.
- Failure behavior: invalid input (non-positive amount, missing period) is rejected with a field-level message; nothing is persisted.
- Acceptance evidence: test creating H1 and H2 entries and asserting per-period and monthly totals.

### R4 — Expenses with dual currency (USD/MXN)

- Trigger: the user records or edits an expense.
- Preconditions: authenticated session; at least one category exists (or an "Uncategorized" default).
- Actor/system: owner; expenses module.
- Expected response: the user can create, edit, and delete expenses with date, amount, currency (USD or MXN), category, and optional note; the original amount and currency are always preserved; lists can be filtered by month and category.
- State change: expense entries persisted with their original currency.
- Visible/resulting evidence: an expenses view listing entries with native currency plus the converted reporting-currency value.
- Failure behavior: invalid input (non-positive amount, unsupported currency, missing date) is rejected with a field-level message.
- Acceptance evidence: test creating one USD and one MXN expense and asserting both native and converted values are shown correctly.

### R5 — Exchange rates and reporting currency

- Trigger: the user views any aggregated total, or edits settings.
- Preconditions: authenticated session.
- Actor/system: owner; settings module; all aggregation logic.
- Expected response: the user can set/update two manually maintained exchange rates — USD→CRC and MXN→CRC — and choose the reporting currency among CRC, USD, and MXN (default CRC); every aggregation (overview, balance, category actuals, project affordability) converts mixed-currency amounts to the reporting currency using the current stored rates (cross-currency conversions derive from the two CRC rates); the rates in effect are displayed alongside converted totals.
- State change: settings record persisted; aggregates recomputed on read (no stored converted values).
- Visible/resulting evidence: settings page with both rate controls and the reporting-currency selector; converted totals annotated with the rates used.
- Failure behavior: non-positive or non-numeric rates rejected; if a required rate is not set, affected totals show a clear "set exchange rate" prompt instead of a wrong number.
- Acceptance evidence: test changing each rate and asserting aggregated totals change accordingly, including a cross-currency (USD amount shown in MXN) case derived from the CRC rates.

### R6 — Category budget plan (category-by-month matrix)

- Trigger: the user manages categories or plans amounts for a year.
- Preconditions: authenticated session.
- Actor/system: owner; category plan module.
- Expected response: the user can create/rename/archive spending categories (e.g., food, services, subscriptions, rent) and enter a planned amount per category per month for a selected year; the view shows the full matrix with a row total per category and a column total per month, plus a grand total; planned vs. actual (from expenses in that category/month) is visible per cell or per row.
- State change: categories and per-month plan amounts persisted.
- Visible/resulting evidence: a plan matrix view for a selected year with row and column totals.
- Failure behavior: negative plan amounts rejected; deleting a category with recorded expenses is blocked (archive instead) to preserve history.
- Acceptance evidence: test entering plan amounts for two categories across months and asserting row, column, and grand totals.

### R7 — Monthly overview (earned / spent / saved / remaining)

- Trigger: the user opens the overview for a selected month.
- Preconditions: authenticated session.
- Actor/system: owner; overview module.
- Expected response: for the selected month the app shows, in the reporting currency: total earned (income), total spent (expenses), total saved (the month's lifetime savings contributions per R12 — project allocations are tracked separately per project and are not part of this figure), and remaining (earned − spent − saved); a breakdown by half-month period is available; the current lifetime savings balance is also displayed on the overview.
- State change: none (derived view).
- Visible/resulting evidence: overview dashboard as the app landing page after login, including the lifetime savings balance.
- Failure behavior: months without data show zeros, not errors.
- Acceptance evidence: test with known income, expenses, and allocations asserting the four computed figures.

### R8 — Running balance

- Trigger: the user opens the balance view or records income/expenses.
- Preconditions: authenticated session; starting balance set (defaults to 0, editable in settings).
- Actor/system: owner; balance module.
- Expected response: a chronological running balance in the reporting currency: starting balance plus cumulative income minus cumulative expenses, displayed per month (and per half-month period within a month).
- State change: starting balance persisted when edited; running values derived.
- Visible/resulting evidence: balance view with per-period rows and a current balance figure.
- Failure behavior: derived values never editable directly; recalculation is deterministic from source records.
- Acceptance evidence: test asserting the running balance across two months with mixed income/expenses.

### R9 — Purchase projects with savings allocation and projected dates

- Trigger: the user manages purchase goals.
- Preconditions: authenticated session; a per-period project allocation configured as a fixed amount per half-month period (H1/H2), editable in settings or on the projects view.
- Actor/system: owner; projects module.
- Expected response: the user can create, edit, reorder (priority), complete, and delete projects, each with a name, cost, and currency; the app allocates the fixed per-period amount to projects in priority order, accumulating into each project's own saved total (separate from lifetime savings, R12), and shows, per project, the accumulated amount, percentage funded, and the projected half-month period/date by which it becomes affordable.
- State change: projects, per-project accumulated savings, and the fixed allocation setting persisted; projections derived.
- Visible/resulting evidence: projects view listing each goal with cost, funded %, and projected affordability date.
- Failure behavior: zero or unset allocation shows "no projection possible" per project instead of an infinite/aberrant date; non-positive costs rejected.
- Acceptance evidence: test with a known allocation and two prioritized projects asserting each projected affordability period.

### R10 — Responsive, mobile-friendly UI

- Trigger: the user opens any view on a phone-sized viewport (~360–430 px wide) or desktop.
- Preconditions: none beyond authentication.
- Actor/system: owner; UI layer.
- Expected response: all views (login, overview, income, expenses, plan matrix, balance, projects, settings) are usable without horizontal scrolling on phone viewports; the plan matrix degrades gracefully (e.g., horizontal scroll within the table or per-category collapse); navigation is reachable one-handed (bottom or collapsible nav on mobile).
- State change: none.
- Visible/resulting evidence: documented viewport checks (screenshots or manual checklist) for each view at mobile and desktop widths.
- Failure behavior: n/a (layout requirement).
- Acceptance evidence: manual responsive checklist executed and recorded in progress evidence; no blocking layout defects at 360 px width.

### R11 — Input validation and error handling

- Trigger: any create/edit operation or failed server action.
- Preconditions: authenticated session.
- Actor/system: owner; all modules.
- Expected response: all monetary amounts validated as positive decimals with at most 2 fraction digits and stored without floating-point drift (integer minor units or decimal type); dates validated; server-side validation always enforced regardless of client checks; errors surface as clear, non-technical messages without leaking stack traces or internals.
- State change: invalid submissions persist nothing.
- Visible/resulting evidence: field-level error messages; generic error page/toast for unexpected failures.
- Failure behavior: on unexpected server errors, data remains consistent (transactional writes) and the user is told to retry.
- Acceptance evidence: tests submitting invalid amounts/dates asserting rejection and no persistence.

### R12 — Lifetime (general) personal savings

- Trigger: the user records a contribution to (or withdrawal from) lifetime savings, or views the overview.
- Preconditions: authenticated session.
- Actor/system: owner; savings module; overview module.
- Expected response: the user can record dated lifetime-savings contributions (and negative adjustments/withdrawals) with amount and currency (USD, MXN, or CRC); the lifetime savings balance is the cumulative sum of contributions, displayed in the reporting currency on the overview; the month's contributions feed the overview "saved" figure (R7); lifetime savings are entirely separate from per-project accumulated savings (R9).
- State change: savings contribution entries persisted; balance derived.
- Visible/resulting evidence: lifetime savings balance and monthly contribution total on the overview; a contributions list with add/edit/delete.
- Failure behavior: zero amounts rejected; a withdrawal that would drive the lifetime balance negative is rejected with a clear message.
- Acceptance evidence: test recording contributions across two months asserting the running balance and each month's "saved" figure.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| App must be secure: authentication, protection of financial data | R1, R2 |
| No secrets in the repository | R2 |
| Operations sheet: income split into first/second half of month | R3 |
| Expenses sheet: expenses in USD and MXN, currency handling matters | R4, R5 |
| General plan sheet: categories with per-month amounts and row totals | R6 |
| Overview/Review sheet: spending, earning, saving, remaining per month | R7, R12 |
| Balance sheet: running balance | R8 |
| Projects sheet: purchase goals, fixed per-period allocation, per-project saved total, when affordable | R9 |
| Owner clarification (2026-07-20): lifetime savings vs. per-project savings | R7, R9, R12 |
| Owner clarification (2026-07-20): CRC default reporting currency, USD→CRC and MXN→CRC rates | R5 |
| Mobile-friendly, usable on his phone | R10 |
| Sensible engineering hygiene (spec-author addition, owner allowed additions) | R11 |
| FUTURE: email ingestion, AI assistant, multi-user | Out of scope (architecture notes in design) |

## Assumptions

- Single owner account is sufficient for MVP; the data model still carries a user reference so multi-user is not precluded.
- Two manually maintained exchange rates (USD→CRC, MXN→CRC) at a time are acceptable for MVP (no historical rate per transaction beyond the rates in effect when viewing); cross-currency conversion derives from these rates.
- Calendar months in the owner's local timezone define periods; H1/H2 boundary is fixed at day 15/16.
- Local-first deployment (developer machine or single small host) is acceptable for MVP.
- English UI copy for MVP (owner communicates in English/Spanish; localization is not required yet).

## Open questions

- BLOCKER for final schema validation (not for starting implementation): the reference Excel workbook has NOT been provided. This spec's data model derives from the owner's verbal description. The owner approved this spec on 2026-07-20 conditional on validation against the workbook; it must be supplied and the schema (sheet columns, formulas, category list, allocation rules) validated against it before or during implementation. Any divergence requires a spec revision approved by the owner.

Resolved by owner clarifications (2026-07-20 v2):

- Savings model: two distinct concepts — lifetime (general) personal savings (R12; the overview "saved" figure) and per-project accumulated savings (R9). Resolved.
- Per-period project allocation is a fixed amount per half-month, not a percentage of income (R9). Resolved.
- Default reporting currency is CRC (Costa Rican colón); rates are USD→CRC and MXN→CRC (R5). Resolved.
