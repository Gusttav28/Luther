import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { SideNav, BottomNav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white p-4 md:flex md:flex-col">
        <div className="mb-6 px-3">
          <span className="text-xl font-bold tracking-tight text-brand-700">Luther</span>
        </div>
        <SideNav />
        <div className="mt-auto pt-6">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="btn-secondary w-full">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:hidden">
        <span className="text-lg font-bold tracking-tight text-brand-700">Luther</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="text-sm font-medium text-stone-500">
            Sign out
          </button>
        </form>
      </header>

      <main className="w-full min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
