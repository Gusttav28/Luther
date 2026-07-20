# Luther

Personal finance web application for a single owner: monthly overview, half-month income, dual-currency expenses (USD/MXN with CRC reporting), category budget plan, lifetime savings, running balance, and purchase projects.

Built with Next.js (App Router, TypeScript), Prisma + SQLite, Auth.js (credentials), Tailwind CSS, and Zod. Governed by the spec package at `specs/finance-app-mvp/`.

## Setup

Requirements: Node.js 20.12+ (developed on Node 24) and npm.

```bash
npm install
cp .env.example .env
# Fill in .env:
#   DATABASE_URL  — keep "file:./dev.db" for local SQLite
#   AUTH_SECRET   — generate with: openssl rand -base64 32
#   OWNER_EMAIL / OWNER_PASSWORD — your login credentials (seed only; stored hashed)
npx prisma migrate dev   # create the database
npm run db:seed          # create the owner account and defaults
npm run dev              # http://localhost:3000
```

Log in with the `OWNER_EMAIL` / `OWNER_PASSWORD` you set. The app fails fast with a clear error if required environment variables are missing. Never commit `.env` or `*.db` files (both are gitignored).

## Using the app

- **Overview** (landing page): earned / spent / saved / remaining for a month, half-month breakdown, and lifetime savings balance.
- **Income**: entries per month and half-month period (H1 = days 1–15, H2 = 16–end), in USD or MXN.
- **Expenses**: dated entries in USD or MXN with category and note; original currency is always preserved; converted values shown in the reporting currency.
- **Plan**: spending categories and a category-by-month budget matrix per year with row/column/grand totals and actuals; categories with expenses can be archived, not deleted.
- **Savings**: lifetime personal savings contributions and withdrawals (balance can never go negative); separate from project savings.
- **Balance**: running balance per half-month period from the starting balance, income, and expenses.
- **Projects**: purchase goals with cost and priority; a fixed per-period allocation funds them in priority order, with funded % and projected affordability dates.
- **Settings**: USD→CRC and MXN→CRC exchange rates (manually maintained), reporting currency (CRC default), starting balance, and the per-period project allocation.

All amounts are stored as integer minor units; conversions happen at read time using the current rates with CRC as the pivot currency.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit tests (Vitest; uses a throwaway `prisma/test.db`) |
| `npm run test:e2e` | E2E smoke + responsive checks (Playwright; needs `npx playwright install chromium` once) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Apply/create Prisma migrations |
| `npm run db:seed` | Seed the owner account from env vars |

## Responsive checklist (R10)

Verified automatically by `tests/e2e/responsive.spec.ts`: every view (login, overview, income, expenses, plan, savings, balance, projects, settings) renders at a 360 px viewport with no horizontal page scroll (the plan matrix scrolls inside its own container) and shows the bottom navigation; desktop (1280 px) shows the sidebar.

## Security notes

- All routes and data access require the authenticated session (middleware-enforced); passwords stored as bcrypt hashes; login errors are generic and rate-limited.
- Session cookies are HttpOnly/SameSite; HTTPS assumed for any non-local deployment.
- Secrets and personal financial data live only in `.env` and local `*.db` files, both gitignored.
