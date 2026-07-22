"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthName } from "@/lib/periods";

/** Client month navigation that preserves scroll position. */
export function MonthPicker({
  year,
  month,
  basePath,
  extraParams = {},
}: {
  year: number;
  month: number;
  basePath: string;
  extraParams?: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const url = (m: { year: number; month: number }) => {
    const params = new URLSearchParams({
      ...extraParams,
      year: String(m.year),
      month: String(m.month),
    });
    return `${basePath}?${params.toString()}`;
  };

  function go(target: { year: number; month: number }) {
    if (pending) return;
    startTransition(() => {
      router.push(url(target), { scroll: false });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous month"
        disabled={pending}
        onClick={() => go(prev)}
        className="btn-secondary px-2.5 disabled:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
      <span className="min-w-36 text-center text-sm font-semibold text-ink">
        {monthName(month)} {year}
      </span>
      <button
        type="button"
        aria-label="Next month"
        disabled={pending}
        onClick={() => go(next)}
        className="btn-secondary px-2.5 disabled:opacity-70"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
