import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { SideNav, BottomNav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LutherLogo } from "@/components/logo";
import { LogOut } from "@/components/icons";
import { AppCacheProvider } from "@/components/app-cache-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initial = (session.user.name?.[0] ?? session.user.email?.[0] ?? "L").toUpperCase();

  return (
    <div className="min-h-dvh bg-surface md:flex md:h-dvh md:overflow-hidden">
      {/* Desktop narrow icon sidebar — fixed while main content scrolls */}
      <aside className="hidden h-dvh w-[72px] shrink-0 flex-col items-center border-r border-line bg-surface-card py-4 md:flex">
        <div className="mb-2 flex h-14 w-full shrink-0 items-center justify-center">
          <LutherLogo size="md" priority />
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <SideNav />
        </div>
        <div className="mt-auto flex flex-col items-center gap-3">
          <ThemeToggle compact />
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-950 dark:bg-brand-800 dark:text-white"
            aria-hidden
          >
            {initial}
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted transition hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:ring-offset-neutral-950"
            >
              <LogOut aria-hidden className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-line bg-surface-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <LutherLogo size="sm" />
          <span className="text-lg font-bold tracking-tight text-brand-950 dark:text-brand-300">
            Luther
          </span>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:ring-offset-neutral-950"
          >
            <LogOut aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </form>
      </header>

      <main className="w-full min-w-0 flex-1 overflow-x-hidden px-4 py-6 pb-24 md:h-dvh md:overflow-y-auto md:px-8 md:pb-8 lg:px-10">
        <AppCacheProvider>{children}</AppCacheProvider>
      </main>

      <BottomNav />
    </div>
  );
}
