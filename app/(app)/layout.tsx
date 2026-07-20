import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { SideNav, BottomNav } from "@/components/nav";
import { LogOut } from "@/components/icons";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initial = (session.user.name?.[0] ?? session.user.email?.[0] ?? "L").toUpperCase();

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop narrow icon sidebar */}
      <aside className="hidden w-[72px] shrink-0 flex-col items-center border-r border-stone-200/80 bg-white py-4 md:flex">
        <LinkMark />
        <div className="mt-6 flex-1">
          <SideNav />
        </div>
        <div className="mt-auto flex flex-col items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
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
              className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
            >
              <LogOut aria-hidden className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-stone-200/80 bg-white px-4 py-3 md:hidden">
        <span className="text-lg font-bold tracking-tight text-brand-600">Luther</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500"
          >
            <LogOut aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </form>
      </header>

      <main className="w-full min-w-0 flex-1 overflow-x-hidden px-4 py-6 pb-24 md:px-8 md:pb-8 lg:px-10">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

function LinkMark() {
  return (
    <Link
      href="/"
      aria-label="Luther Overview"
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold tracking-tight text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
    >
      L
    </Link>
  );
}
