import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthName } from "@/lib/periods";

/** Server-rendered month navigation via query params. */
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
  return (
    <div className="flex items-center gap-2">
      <Link href={url(prev)} aria-label="Previous month" className="btn-secondary px-2.5">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </Link>
      <span className="min-w-36 text-center text-sm font-semibold text-stone-800">
        {monthName(month)} {year}
      </span>
      <Link href={url(next)} aria-label="Next month" className="btn-secondary px-2.5">
        <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </Link>
    </div>
  );
}
