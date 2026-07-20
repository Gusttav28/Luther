/**
 * Money handling (R4, R5, R11).
 *
 * All amounts are integer minor units (2 fraction digits for CRC, USD, MXN).
 * Conversion among the three currencies uses CRC as the pivot with the two
 * manually maintained rates (1 USD = usdToCrc CRC, 1 MXN = mxnToCrc CRC).
 * Rates are decimal strings; conversion is done in integer math to avoid drift.
 * Converted values are computed at read time and never persisted.
 */

export const CURRENCIES = ["CRC", "USD", "MXN"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const ENTRY_CURRENCIES = ["USD", "MXN"] as const;
export type EntryCurrency = (typeof ENTRY_CURRENCIES)[number];

export interface Rates {
  /** 1 USD = usdToCrc CRC, as a decimal string (e.g. "512.35"). Null = not set. */
  usdToCrc: string | null;
  /** 1 MXN = mxnToCrc CRC, as a decimal string. Null = not set. */
  mxnToCrc: string | null;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  CRC: "₡",
  USD: "$",
  MXN: "MX$",
};

/** Parse a decimal string like "512.35" into an exact rational {num, den}. */
function parseDecimal(value: string): { num: bigint; den: bigint } | null {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return null;
  const whole = match[1];
  const frac = match[2] ?? "";
  const num = BigInt(whole + frac);
  const den = 10n ** BigInt(frac.length);
  if (num <= 0n) return null;
  return { num, den };
}

/** True if the string is a positive decimal usable as an exchange rate. */
export function isValidRate(value: string): boolean {
  return parseDecimal(value) !== null;
}

/** Round-half-up division for signed bigints. */
function divRound(num: bigint, den: bigint): bigint {
  const negative = num < 0n !== den < 0n;
  const n = num < 0n ? -num : num;
  const d = den < 0n ? -den : den;
  const q = (n * 2n + d) / (d * 2n);
  return negative ? -q : q;
}

export class MissingRateError extends Error {
  constructor(public readonly currency: EntryCurrency) {
    super(`Exchange rate for ${currency}→CRC is not set`);
    this.name = "MissingRateError";
  }
}

/** Rate needed to express `currency` in CRC. CRC itself needs none. */
function rateToCrc(currency: Currency, rates: Rates): { num: bigint; den: bigint } {
  if (currency === "CRC") return { num: 1n, den: 1n };
  const raw = currency === "USD" ? rates.usdToCrc : rates.mxnToCrc;
  const parsed = raw ? parseDecimal(raw) : null;
  if (!parsed) throw new MissingRateError(currency);
  return parsed;
}

/**
 * Convert integer minor units between currencies via the CRC pivot.
 * Throws MissingRateError when a required rate is unset.
 */
export function convertMinor(
  amountMinor: number,
  from: Currency,
  to: Currency,
  rates: Rates
): number {
  if (from === to) return amountMinor;
  const fromRate = rateToCrc(from, rates);
  const toRate = rateToCrc(to, rates);
  // amount * (from→CRC) / (to→CRC)
  const num = BigInt(amountMinor) * fromRate.num * toRate.den;
  const den = fromRate.den * toRate.num;
  return Number(divRound(num, den));
}

/** Which entry currencies lack a stored rate (needed for "set exchange rate" prompts). */
export function missingRates(rates: Rates): EntryCurrency[] {
  const missing: EntryCurrency[] = [];
  if (!rates.usdToCrc || !isValidRate(rates.usdToCrc)) missing.push("USD");
  if (!rates.mxnToCrc || !isValidRate(rates.mxnToCrc)) missing.push("MXN");
  return missing;
}

/**
 * Sum a list of (amountMinor, currency) into the reporting currency.
 * Returns null if any needed rate is missing (caller renders a prompt instead of a number).
 */
export function sumInCurrency(
  amounts: Array<{ amountMinor: number; currency: Currency }>,
  reporting: Currency,
  rates: Rates
): number | null {
  let total = 0;
  for (const { amountMinor, currency } of amounts) {
    try {
      total += convertMinor(amountMinor, currency as Currency, reporting, rates);
    } catch (error) {
      if (error instanceof MissingRateError) return null;
      throw error;
    }
  }
  return total;
}

/** Parse a user-entered amount ("1234.56") into integer minor units. Null if invalid. */
export function parseAmountToMinor(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const whole = Number(match[1]);
  const frac = (match[2] ?? "").padEnd(2, "0");
  const minor = whole * 100 + Number(frac);
  if (!Number.isSafeInteger(minor)) return null;
  return minor;
}

/** Format integer minor units as a display string, e.g. ₡1,234.50 or -$12.00. */
export function formatMinor(amountMinor: number, currency: Currency): string {
  const sign = amountMinor < 0 ? "-" : "";
  const abs = Math.abs(amountMinor);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const grouped = whole.toLocaleString("en-US");
  return `${sign}${CURRENCY_SYMBOLS[currency]}${grouped}.${frac}`;
}

export function currencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency];
}
