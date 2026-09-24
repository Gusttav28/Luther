# Design: Vercel build without migrate deploy

- Governing requirements: R1, R2, R3

## Goals

- Stop the Vercel build from calling Postgres (R1).
- Keep a documented local migrate path (R2).
- Touch only build docs and the build script (R3).

## Current system observations

- `package.json` `"build"` is `prisma generate && prisma migrate deploy && next build`.
- Vercel deploy of `5005735` failed: `P1001` to `db.<project>.supabase.co:5432` during `migrate deploy`.
- README line 19 says migrate deploy “also runs on Vercel build”.
- Production schema already matches `schema.prisma`.

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `package.json` | `build`: `prisma generate && next build` | R1, R3 |
| `README.md` | Local-only wording for `npx prisma migrate deploy` | R2, R3 |
| `progress/current.md` | Implementation log | R1 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| `specs/vercel-build-no-migrate/*` | This spec package | — |

## Data and control flow

```
Vercel build (after):
  prisma generate → next build
  (no migrate deploy)

Local migrate (unchanged command, docs only):
  npx prisma migrate deploy   # uses DIRECT_URL
```

Invariant: applying SQL to production is a human/local step, not a Vercel build step.

## Validation and failure handling

- TV1: `package.json` `build` string contains `prisma generate` and `next build`, not `migrate`.
- Redeploy `main` after merge; inspect Vercel logs for a successful build (no `P1001` from migrate).

## Security, privacy, accessibility, and performance

- No new env vars, secrets, or data access.
- Runtime queries still go through existing `DATABASE_URL`.

## Dependencies

No new npm packages.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Point Vercel `DIRECT_URL` at the pooler | Rejected for this item | Owner approved removing migrate from the build |
| Keep migrate deploy and open `:5432` to Vercel | Rejected | Network change out of scope |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | `package.json` build script |
| R2 | `README.md` setup + commands |
| R3 | file list; no schema/env |
