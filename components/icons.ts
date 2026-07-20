import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Grid2x2,
  Landmark,
  LayoutDashboard,
  LogOut,
  Scale,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

export type NavHref =
  | "/"
  | "/income"
  | "/expenses"
  | "/plan"
  | "/savings"
  | "/balance"
  | "/projects"
  | "/settings";

export const NAV_LINKS: Array<{
  href: NavHref;
  label: string;
  icon: LucideIcon;
}> = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: ArrowDownToLine },
  { href: "/expenses", label: "Expenses", icon: ArrowUpFromLine },
  { href: "/plan", label: "Plan", icon: Grid2x2 },
  { href: "/savings", label: "Savings", icon: Landmark },
  { href: "/balance", label: "Balance", icon: Scale },
  { href: "/projects", label: "Projects", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

export { LogOut };
