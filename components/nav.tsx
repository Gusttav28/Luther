"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
              active
                ? "bg-brand-500 text-white shadow-sm"
                : "text-stone-500 hover:bg-brand-50 hover:text-brand-600"
            }`}
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
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200/80 bg-white/95 backdrop-blur md:hidden"
      aria-label="Main"
    >
      <div className="grid grid-cols-8">
        {NAV_LINKS.map((link) => {
          const active = isActive(pathname, link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                active ? "text-brand-600" : "text-stone-500"
              }`}
            >
              <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
