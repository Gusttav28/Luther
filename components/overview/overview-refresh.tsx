"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/** Client refresh affordance for the Overview header. */
export function OverviewRefresh() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="btn-secondary inline-flex items-center gap-1.5"
      aria-label="Refresh overview"
      title="Refresh"
    >
      <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );
}
