# Tasks: Vercel build without migrate deploy

## Implementation checklist

- [ ] T1 — Remove migrate deploy from the Vercel build
  - Files: `package.json`
  - Requirements: R1, R3
  - Preconditions: human-approved spec
  - Expected evidence: `"build": "prisma generate && next build"`

- [ ] T2 — Document local-only migrate
  - Files: `README.md`
  - Requirements: R2, R3
  - Preconditions: T1
  - Expected evidence: setup comment no longer says migrate runs on Vercel build; `npx prisma migrate deploy` still listed as the local apply command

- [ ] T3 — Record implementation and land on main
  - Files: `progress/current.md`
  - Requirements: R1
  - Preconditions: T1, T2
  - Expected evidence: `IMPLEMENTED`; branch pushed; PR merged; Vercel production deploy of that commit succeeds

## Verification

- [ ] TV1 — Build script check
  - Covers: R1
  - Expected result: `node -e` print of `package.json` scripts.build is `prisma generate && next build`

- [ ] TV2 — Redeploy
  - Covers: R1
  - Expected result: Vercel production deploy of the merged commit is not Error / not `P1001` from migrate deploy

- [ ] TV3 — Diff hygiene
  - Covers: R3
  - Expected result: no `.env`, no `prisma/schema.prisma`, no new packages

## Traceability

| Task | Requirement IDs |
| --- | --- |
| T1 | R1, R3 |
| T2 | R2, R3 |
| T3 | R1 |
| TV1 | R1 |
| TV2 | R1 |
| TV3 | R3 |

## Final scope check

- [x] Every requirement maps to at least one task.
- [x] Every changed file is listed in the design.
- [x] No unrelated cleanup or unapproved behavior is included.
- [x] Required tests/checks are defined.
