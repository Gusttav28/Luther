"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { rematerializeOverviewAction } from "@/app/(app)/overview-actions";

/** Rematerialize waterfall for the viewed month, then refresh Overview. */
export function OverviewRefresh({
  year,
  month,
  variant = "default",
}: {
  year: number;
  month: number;
  variant?: "default" | "icon";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onRefresh = () => {
    startTransition(async () => {
      await rematerializeOverviewAction(year, month);
      router.refresh();
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={onRefresh}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-card text-ink transition hover:border-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:opacity-70 dark:ring-offset-neutral-950"
        aria-label="Refresh overview"
        title="Refresh"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`}
          strokeWidth={2.1}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onRefresh}
      className="btn-secondary inline-flex items-center gap-1.5"
      aria-label="Refresh overview"
      title="Refresh"
    >
      <RefreshCw
        className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="hidden sm:inline">{pending ? "Refreshing…" : "Refresh"}</span>
    </button>
  );
}
