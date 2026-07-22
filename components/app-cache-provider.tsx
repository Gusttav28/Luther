"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PREFETCH_ROUTES } from "@/lib/client-cache";

/** Prefetch secondary routes after the shell mounts (does not block first paint). */
export function AppCacheProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    for (const href of PREFETCH_ROUTES) {
      if (cancelled || href === "/") continue;
      try {
        router.prefetch(href);
      } catch {
        // ignore
      }
    }

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <>{children}</>;
}
