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

/** Small annotation showing the USD→CRC rate in effect for converted totals. */
export function RatesNote({ usdToCrc }: { usdToCrc: string | null }) {
  if (!usdToCrc) return null;
  return <p className="text-xs text-ink-faint">Rate: $1 = ₡{usdToCrc}</p>;
}
