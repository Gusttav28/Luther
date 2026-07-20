import Link from "next/link";
import { formatMinor, type Currency } from "@/lib/money";

/**
 * Renders a converted amount, or the "set exchange rate" prompt when the
 * needed rate is missing (R5).
 */
export function Money({
  minor,
  currency,
  className = "",
}: {
  minor: number | null;
  currency: Currency;
  className?: string;
}) {
  if (minor === null) {
    return (
      <Link href="/settings" className={`text-xs font-medium text-amber-600 underline ${className}`}>
        Set exchange rate
      </Link>
    );
  }
  return <span className={className}>{formatMinor(minor, currency)}</span>;
}

/** Small annotation showing the rates in effect for converted totals (R5). */
export function RatesNote({
  usdToCrc,
  mxnToCrc,
}: {
  usdToCrc: string | null;
  mxnToCrc: string | null;
}) {
  const parts: string[] = [];
  if (usdToCrc) parts.push(`$1 = ₡${usdToCrc}`);
  if (mxnToCrc) parts.push(`MX$1 = ₡${mxnToCrc}`);
  if (parts.length === 0) return null;
  return <p className="text-xs text-stone-400">Rates: {parts.join(" · ")}</p>;
}
