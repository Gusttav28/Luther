# Current implementation progress

- Work item: vercel-build-no-migrate (`specs/vercel-build-no-migrate/`)
- Branch: `cursor/vercel-build-no-migrate-ef43`
- Spec package: 2026-09-23
- Human approval: owner 2026-09-23 — take `migrate deploy` out of the Vercel build, keep it local, redeploy
- Implementer session: 2026-09-23
- Handoff: **IMPLEMENTED**

## Outcome

Vercel `npm run build` no longer runs `prisma migrate deploy` (that step was failing with `P1001` to Supabase `:5432`). Migrations stay a local command.

## Files

- `package.json` — `build`: `prisma generate && next build`
- `README.md` — local-only migrate wording
- `specs/vercel-build-no-migrate/` — approved hotfix spec

## Verification

- TV1: `scripts.build` is `prisma generate && next build`
- TV2: pending production redeploy of the merged commit
- TV3: no `.env`, no schema, no new packages
