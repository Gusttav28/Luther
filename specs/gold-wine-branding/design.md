# Design: Gold & dark wine branding with lion mark

- Governing requirements: R1–R4

## Palette

| Token | Role | Light | Dark |
| --- | --- | --- | --- |
| `brand.*` | Dark wine primary (buttons, active, links) | wine scale | same scale |
| `gold.*` | Accent complementary to lion | gold scale | same scale |
| Semantic surfaces | Page/card/text | existing CSS variables | existing CSS variables |

Wine mid: `#6B1B2A` · Gold mid: `#C9A227` (matches lion)

## Files

| Path | Change |
| --- | --- |
| `tailwind.config.ts` | Wine `brand` + `gold` scales |
| `app/globals.css` | Primary/link accents use wine; chart accents lean wine/gold |
| `public/luther-lion.png` | Static lion asset |
| `app/icon.png` | Tab favicon (Next.js metadata icon) |
| `components/logo.tsx` | Shared lion logo component |
| `app/(app)/layout.tsx` | Sidebar + mobile header use Logo |
| `app/login/page.tsx` | Login hero uses Logo |
| `app/layout.tsx` | Metadata icons reference lion |

## Dependencies

No new packages. Next.js `Image` / static files only.
