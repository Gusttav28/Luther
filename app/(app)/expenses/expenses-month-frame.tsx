"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthName } from "@/lib/periods";

function buildMonthHref(
  basePath: string,
  year: number,
  month: number,
  extraParams: Record<string, string>
): string {
  const params = new URLSearchParams({
    ...extraParams,
    year: String(year),
    month: String(month),
  });
  return `${basePath}?${params.toString()}`;
}

/**
 * Expenses header month navigation + loading overlay for content below.
 */
export function ExpensesMonthFrame({
  year,
  month,
  basePath = "/expenses",
  extraParams = {},
  title,
  actions,
  children,
}: {
  year: number;
  month: number;
  basePath?: string;
  extraParams?: Record<string, string>;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  function go(target: { year: number; month: number }) {
    if (pending) return;
    startTransition(() => {
      router.push(buildMonthHref(basePath, target.year, target.month, extraParams), {
        scroll: false,
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title}
        <div className="flex flex-wrap items-center gap-3">
          {actions}
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
        </div>
      </div>

      <div className="relative min-h-[12rem]">
        <div
          className={`space-y-6 transition-[filter,opacity] duration-150 ${
            pending ? "pointer-events-none opacity-60 blur-[2px]" : ""
          }`}
          aria-busy={pending}
        >
          {children}
        </div>
        {pending ? (
          <div
            className="absolute inset-0 z-10 flex items-start justify-center bg-surface/40 pt-24"
            role="status"
            aria-live="polite"
            aria-label="Loading month"
          >
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-800 border-t-transparent dark:border-brand-400 dark:border-t-transparent" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
