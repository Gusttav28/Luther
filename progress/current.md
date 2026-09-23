# Current implementation progress

- Work item: expense-subcategories production hotfix (`parentId` missing on Supabase)
- Branch: `cursor/category-parent-migrate-ef43`
- Cause: PR #7 deployed Prisma queries that select `Category.parentId`, but Vercel build only ran `prisma generate` — never `migrate deploy`. Every page that loads categories throws a server exception.
- Handoff: **IMPLEMENTED**

## Fix

- `package.json` `build` now runs `prisma migrate deploy` so the next Vercel deploy applies `20260923021000_category_parent`.
- Migration SQL is idempotent (`IF NOT EXISTS`) so a manual Supabase apply and migrate deploy do not conflict.

## Immediate unblock (no deploy required)

Run this in the Supabase SQL editor, then reload luther-two.vercel.app.
