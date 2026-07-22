"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { rematerializeOverviewAction } from "@/app/(app)/overview-actions";

/** Rematerialize waterfall for the viewed month, then refresh Overview. */
export function OverviewRefresh({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await rematerializeOverviewAction(year, month);
          router.refresh();
        });
      }}
      className="btn-secondary inline-flex items-center gap-1.5"
      aria-label="Refresh overview"
      title="Refresh"
    >
      <RefreshCw
        className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`}
        strokeWidth={1.75}
      />
      <span className="hidden sm:inline">{pending ? "Refreshing…" : "Refresh"}</span>
    </button>
  );
}
