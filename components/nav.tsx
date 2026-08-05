"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { NAV_LINKS, type NavHref } from "@/components/icons";
import { useOptionalAddExpenseSheet } from "@/components/add-expense-sheet";

const PRIMARY_HREFS: NavHref[] = ["/", "/expenses", "/income"];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Desktop narrow icon sidebar. */
export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col items-center gap-1" aria-label="Main">
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-label={link.label}
            title={link.label}
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:ring-offset-neutral-950 ${
              active
                ? "bg-brand-800 text-white shadow-sm dark:bg-brand-700 dark:text-white"
                : "text-ink-muted hover:bg-surface-muted hover:text-brand-800 dark:hover:text-brand-300"
            }`}
            prefetch
          >
            <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile floating pill navigation + external N add control. */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const sheet = useOptionalAddExpenseSheet();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = PRIMARY_HREFS.map(
    (href) => NAV_LINKS.find((link) => link.href === href)!,
  );
  const secondary = NAV_LINKS.filter((link) => !PRIMARY_HREFS.includes(link.href));
  const secondaryActive = secondary.some((link) => isActive(pathname, link.href));
  const moreEmphasized = moreOpen || secondaryActive;

  function onAddExpense() {
    setMoreOpen(false);
    if (sheet) {
      sheet.openAddExpense();
      return;
    }
    router.push("/expenses?add=1");
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Main"
    >
      <div className="flex items-end gap-2.5">
        <div className="relative">
          {moreOpen && (
            <div
              id="mobile-more-menu"
              className="absolute bottom-full left-1/2 mb-3 w-56 -translate-x-1/2 rounded-2xl border border-line bg-surface-elevated p-2 shadow-card"
            >
              {secondary.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                      isActive(pathname, link.href)
                        ? "bg-brand-100 text-brand-950 dark:bg-brand-800 dark:text-white"
                        : "text-ink-secondary hover:bg-surface-muted"
                    }`}
                  >
                    <Icon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1 rounded-full bg-neutral-700 px-2 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.28)] dark:bg-neutral-800 dark:shadow-[0_8px_28px_rgba(0,0,0,0.55)]">
            {primary.map((link) => {
              const active = isActive(pathname, link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-700 dark:focus-visible:ring-offset-neutral-800 ${
                    active
                      ? "gap-2 rounded-full bg-white px-3.5 py-2 text-neutral-800 shadow-sm"
                      : "h-11 w-11 rounded-full text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                  prefetch
                >
                  <Icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  {active ? (
                    <span className="text-sm font-medium leading-none">{link.label}</span>
                  ) : null}
                </Link>
              );
            })}

            <button
              type="button"
              aria-label="More"
              aria-expanded={moreOpen}
              aria-controls="mobile-more-menu"
              onClick={() => setMoreOpen((open) => !open)}
              className={`flex h-11 w-11 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-700 dark:focus-visible:ring-offset-neutral-800 ${
                moreEmphasized
                  ? "bg-white/15 text-white"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              <MoreHorizontal aria-hidden className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <button
          type="button"
          aria-label="Add expense"
          title="Add expense"
          onClick={onAddExpense}
          className="flex h-14 w-14 shrink-0 items-center justify-center self-center rounded-full bg-brand-700 text-lg font-semibold text-white shadow-[0_8px_20px_rgba(38,103,73,0.35)] transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 dark:bg-brand-600 dark:hover:bg-brand-500 dark:ring-offset-neutral-950"
        >
          N
        </button>
      </div>
    </nav>
  );
}
