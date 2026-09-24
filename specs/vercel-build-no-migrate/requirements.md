# Requirements: Vercel build without migrate deploy

- Work item: specs/vercel-build-no-migrate/
- Outcome: Production deploys of `main` succeed so the latest app code goes live
- Branch: `cursor/vercel-build-no-migrate-ef43`
- Status: Human-approved 2026-09-23 (owner: take migrate deploy out of the Vercel build, keep it local, redeploy)
- Spec version: 2026-09-23

## Problem

Vercel production builds run `prisma migrate deploy` and fail with Prisma `P1001` (cannot reach Supabase direct host `:5432`). All repo migrations are already applied on production. Latest `main` (PR #9) never deploys.

## In scope

- Remove `prisma migrate deploy` from the npm `build` script used by Vercel.
- Document that `npx prisma migrate deploy` is local/manual only.
- Redeploy `main` after the change lands.

## Out of scope

- Schema or data changes.
- New npm packages.
- Changing Vercel/Supabase network or `DIRECT_URL`.
- Product UI or query behavior.

## Definitions

- **Build script**: `package.json` `"build"`, which Vercel runs as `npm run build`.
- **Local migrate**: `npx prisma migrate deploy` run from a machine that can reach `DIRECT_URL`.

## Requirements

### R1 — Vercel build does not contact Postgres

- Trigger: Vercel runs `npm run build` for `main`.
- Preconditions: `DATABASE_URL` / `DIRECT_URL` may be unreachable from the build machine.
- Actor/system: Vercel build.
- Expected response: `prisma generate && next build` completes without `prisma migrate deploy`.
- State change: none in the database.
- Visible/resulting evidence: production deploy of this commit is not `P1001` from migrate deploy.
- Failure behavior: Next.js/Prisma generate errors still fail the build.
- Acceptance evidence: `package.json` `build` has no `migrate deploy`; Vercel deploy of the merged commit succeeds.

### R2 — Migrations stay a local command

- Trigger: Owner applies a future Prisma migration.
- Preconditions: `DIRECT_URL` reachable locally.
- Actor/system: owner/dev machine.
- Expected response: README tells them to run `npx prisma migrate deploy` locally; it is not implied to run on Vercel build.
- State change: none in this item (docs only).
- Visible/resulting evidence: README setup and commands no longer say migrate runs on Vercel build.
- Failure behavior: n/a.
- Acceptance evidence: README updated; no new migrate automation.

### R3 — Secrets and schema unchanged

- Trigger: this change set.
- Preconditions: existing `.env` / Vercel env.
- Actor/system: implementer.
- Expected response: no `.env`, credentials, or Prisma schema edits.
- State change: none.
- Visible/resulting evidence: diff is `package.json`, README, spec/progress only.
- Failure behavior: reject any secret or schema file.
- Acceptance evidence: `git diff` has no `.env` / `prisma/schema.prisma`.

## Traceability

| Source request / criterion | Requirement IDs |
| --- | --- |
| Owner: take migrate deploy out of Vercel build | R1 |
| Owner: keep migrate deploy as a local command | R2 |
| Owner: redeploy main | R1 |
| Hard boundary: no secrets / no schema | R3 |

## Assumptions

- Production `_prisma_migrations` already includes all three repo migrations.
- App runtime still uses `DATABASE_URL` (pooler) at request time; only the build step is changing.

## Open questions

- None. Owner approved this exact plan on 2026-09-23.
