"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { NAV_LINKS } from "@/components/icons";

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

/** Mobile bottom navigation with Lucide icons. */
export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV_LINKS.filter((link) => ["/", "/expenses", "/plan"].includes(link.href));
  const secondary = NAV_LINKS.filter((link) => !["/", "/expenses", "/plan"].includes(link.href));
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface-card/95 backdrop-blur md:hidden"
      aria-label="Main"
    >
      {moreOpen && (
        <div
          id="mobile-more-menu"
          className="absolute bottom-full right-2 mb-2 w-52 rounded-xl border border-line bg-surface-elevated p-2 shadow-card"
        >
          {secondary.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
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
      <div className="grid grid-cols-4">
        {primary.map((link) => {
          const active = isActive(pathname, link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                active ? "text-brand-800 dark:text-brand-300" : "text-ink-muted"
              }`}
            >
              <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
              <span>{link.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="mobile-more-menu"
          onClick={() => setMoreOpen((open) => !open)}
          className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
            moreOpen || secondary.some((link) => isActive(pathname, link.href))
              ? "text-brand-800 dark:text-brand-300"
              : "text-ink-muted"
          }`}
        >
          <MoreHorizontal aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
