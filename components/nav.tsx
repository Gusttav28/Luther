"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview", icon: "◧" },
  { href: "/income", label: "Income", icon: "↧" },
  { href: "/expenses", label: "Expenses", icon: "↥" },
  { href: "/plan", label: "Plan", icon: "▦" },
  { href: "/savings", label: "Savings", icon: "◈" },
  { href: "/balance", label: "Balance", icon: "≡" },
  { href: "/projects", label: "Projects", icon: "★" },
  { href: "/settings", label: "Settings", icon: "⚙" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Desktop sidebar links. */
export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive(pathname, link.href)
              ? "bg-brand-600 text-white"
              : "text-stone-600 hover:bg-stone-200"
          }`}
        >
          <span aria-hidden className="w-4 text-center">
            {link.icon}
          </span>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/** Mobile bottom navigation (one-handed reach, R10). */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-8">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              isActive(pathname, link.href) ? "text-brand-600" : "text-stone-500"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {link.icon}
            </span>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
