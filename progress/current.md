# Current implementation progress

- Work item: unbreak Vercel build after category-parent migrate
- Branch: `cursor/unbreak-vercel-build-ef43`
- Cause: PR #8 added `prisma migrate deploy` to `npm run build`. Vercel IAD cannot open `db.*.supabase.co:5432` (P1001), so the deploy never finishes.
- Handoff: **IMPLEMENTED**

## Fix

- Build is `prisma generate && next build` again. Schema changes are applied in the Supabase SQL editor (or locally with `DIRECT_URL`), not on the Vercel build machine.

## Still required for the runtime crash

`Category.parentId` must exist in production. If that SQL was not run yet, the app will deploy but keep throwing on every category query.
