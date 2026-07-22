# Luther

Personal finance web application for a single owner: monthly overview, half-month income, dual-currency expenses (USD/CRC), category budget plan, percentage-based lifetime savings and purchase projects.

Built with Next.js (App Router, TypeScript), Prisma + **Supabase Postgres**, Auth.js (credentials), Tailwind CSS, and Zod.

## Setup

Requirements: Node.js 20.12+ and npm. A Supabase project with Postgres.

```bash
npm install
cp .env.example .env
# Fill in .env:
#   DATABASE_URL  — Supabase transaction pooler URI (port 6543, ?pgbouncer=true)
#   DIRECT_URL    — Supabase direct URI (port 5432) for migrations
#   AUTH_SECRET   — generate with: openssl rand -base64 32
#   OWNER_EMAIL / OWNER_PASSWORD — your login credentials (seed only; stored hashed)
npx prisma db push       # or: npx prisma migrate deploy
npm run db:seed          # create the owner account and defaults
npm run dev              # http://localhost:3000
```

Log in with the `OWNER_EMAIL` / `OWNER_PASSWORD` you set. Never commit `.env` or secrets.

## Using the app

- **Overview**: earned / spent / saved / remaining; saved follows the 70% lifetime waterfall from leftover after expenses.
- **Income**: entries per month and half-month (H1 / H2), mark planned income for the waterfall base.
- **Expenses**: dated entries in USD or CRC.
- **Plan**: category-by-month budget matrix.
- **Savings**: automatic **70%** of leftover after expenses; manual adjustments/withdrawals still available.
- **Balance**: running balance per half-month.
- **Projects**: cost, allocation **%** of post-lifetime leftover (max 70%), period (H1/H2/both), goal date, and one **priority** project.
- **Settings**: USD→CRC rate, reporting currency, starting balance.

All amounts are stored as integer minor units.

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
