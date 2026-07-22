import { getSettings } from "@/lib/queries/settings";
import { materializeMonthWaterfall } from "@/lib/queries/waterfall-scope";

/** Rematerialize a month after a successful mutation; never fails the primary write. */
export async function safeMaterializeMonth(
  userId: string,
  year: number,
  month: number
): Promise<void> {
  try {
    const settings = await getSettings(userId);
    await materializeMonthWaterfall(
      userId,
      year,
      month,
      settings.reportingCurrency,
      settings.rates
    );
  } catch {
    // Primary mutation already succeeded.
  }
}

export function yearMonthFromDate(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** Parse `YYYY-MM-DD` (or Date) into calendar year/month in local time. */
export function yearMonthFromDateInput(date: string | Date): { year: number; month: number } {
  if (date instanceof Date) return yearMonthFromDate(date);
  const [y, m] = date.split("-").map(Number);
  if (Number.isInteger(y) && Number.isInteger(m) && m >= 1 && m <= 12) {
    return { year: y, month: m };
  }
  return yearMonthFromDate(new Date(`${date}T12:00:00`));
}
