# Design: Mobile Pill Navigation Bar

- Governing requirements: R1, R2, R3, R4, R5, R6

## Goals

- Replace the mobile full-width bottom strip with a floating dark pill nav (R3).
- Primary destinations: Overview, Expenses, Income (R1); secondary under More ⋯ (R2).
- Preserve active-route semantics and accessibility without touching financial behavior (R4, R6).
- Keep desktop sidebar and scroll model unchanged (R5).

## Current system observations

- `components/nav.tsx` — `BottomNav` is `fixed inset-x-0 bottom-0`, `border-t`, `md:hidden`, grid of 4: primary `["/", "/expenses", "/plan"]` plus More for remaining `NAV_LINKS`.
- `components/icons.ts` — shared `NAV_LINKS` with Lucide icons; Overview `/`, Income `/income`, Expenses `/expenses` already defined.
- `app/(app)/layout.tsx` — main uses `pb-24` on mobile for bottom-nav clearance; desktop sidebar unchanged by this work.
- Visual reference: `specs/mobile-pill-nav/reference-pill-bar.png` (dark outer stadium, white active chip with icon+label, icon-only inactives).

## Files to change

| Path | Change | Requirement IDs |
| --- | --- | --- |
| `components/nav.tsx` | Redesign `BottomNav`: primary set `/`, `/expenses`, `/income`; floating dark pill chrome; white active chip; More ⋯ for Plan/Savings/Balance/Projects/Settings; keep `SideNav` behavior. | R1–R6 |
| `app/(app)/layout.tsx` | Adjust mobile bottom padding if needed so content clears the floating bar (inset + shadow). | R5 |
| `components/icons.ts` | Only if a small helper export is needed (e.g. primary href list); prefer keeping helpers local to `nav.tsx` unless reuse is cleaner. No route/icon inventory expansion required. | R1, R2 |

## New files

| Path | Purpose | Requirement IDs |
| --- | --- | --- |
| _(none required)_ | Implementation stays in existing shell components. | — |

Reference asset (spec only, not runtime):

| Path | Purpose |
| --- | --- |
| `specs/mobile-pill-nav/reference-pill-bar.png` | Owner visual target for implementer/reviewer |

## Data and control flow

```
pathname (usePathname)
        │
        ▼
BottomNav (client)
  primary = [Overview /, Expenses /expenses, Income /income]
  secondary = NAV_LINKS minus primary hrefs
        │
        ├─► Link primary → navigate (existing prefetch)
        │     active primary ⇒ white chip (icon + label)
        │     inactive ⇒ white/light icon only
        │
        └─► More button (⋯)
              open ⇒ popover/menu above bar with secondary Links
              onNavigate ⇒ close menu
```

### Visual structure (mobile)

1. Outer container: `fixed` bottom, horizontally centered, horizontal inset (~12–16px), bottom safe inset (~12–16px + `env(safe-area-inset-bottom)` if practical), `z-20`, `md:hidden`.
2. Outer pill: dark charcoal/slate background (prefer existing tokens where possible, e.g. near `neutral-800` / brand-ink equivalents), `rounded-full`, horizontal padding, soft shadow.
3. Inner row: flex, evenly spaced items — three primary controls + More.
4. Active primary: nested `rounded-full` white chip, dark text/icon, horizontal padding around icon + label.
5. Inactive / More closed: icon-only, light stroke on dark bar.
6. More open: elevated menu (`absolute` above bar) listing secondary links with icon + label (existing pattern acceptable; style to remain readable on light/dark page backgrounds).

### Active rules

Reuse existing `isActive(pathname, href)`:

- `/` → exact match only.
- Others → `pathname.startsWith(href)`.
- Primary active chip only when a primary href is active.
- If a secondary href is active, emphasize More; do not show a primary white chip.

### Desktop

`SideNav` and desktop aside remain as today; `BottomNav` stays `md:hidden`.

## Validation and failure handling

- No form validation; navigation is link-based.
- Menu state is ephemeral React state; no persistence.
- If pathname matches none of the known app links, show no primary active chip; More not forced open.

## Security, privacy, accessibility, and performance

- Auth gate remains in `app/(app)/layout.tsx`; nav does not weaken it.
- No financial values, secrets, or new cookies/localStorage from this feature.
- Accessible names on icon-only controls; More uses `aria-expanded` and `aria-controls`.
- Visible focus rings on links/button (existing brand focus tokens).
- Prefer CSS-only styling; no new animation libraries. Keep client bundle change limited to `nav.tsx` class/structure updates.
- Do not introduce new dependencies.

## Dependencies

- **No new npm dependencies.** Use existing `next/link`, `lucide-react`, Tailwind, React state.

## Alternatives considered

| Alternative | Decision | Reason |
| --- | --- | --- |
| Keep Plan as primary; put Income under More | Rejected | Owner requested Overview, Expenses, Income as primary |
| Only three icons, no More | Rejected | Owner requires secondary routes under ⋯ |
| Full-width bar with new colors only | Rejected | Reference is floating stadium pill with white active chip |
| Separate mobile nav component file | Deferred | Not required; `BottomNav` rewrite in `nav.tsx` is enough unless file size becomes unwieldy |

## Requirement mapping

| Requirement | Design coverage |
| --- | --- |
| R1 | Primary href set in `BottomNav`; `NAV_LINKS` icons |
| R2 | More disclosure + secondary filter |
| R3 | Floating pill chrome + active chip styles; reference PNG |
| R4 | `isActive` + primary vs More emphasis rules |
| R5 | Fixed positioning + layout `pb-*` / safe inset |
| R6 | `aria-*`, focus rings, no new data persistence |
