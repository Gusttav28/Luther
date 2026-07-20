/**
 * Zod schemas for all user input (R11). Server actions always validate with
 * these regardless of client-side checks. Amounts are parsed to integer minor
 * units; invalid submissions persist nothing.
 */
import { z } from "zod";
import { parseAmountToMinor, isValidRate } from "./money";

/** Positive money amount, max 2 fraction digits, parsed to integer minor units. */
export const amountSchema = z
  .string()
  .trim()
  .refine((v) => parseAmountToMinor(v) !== null && parseAmountToMinor(v)! > 0, {
    message: "Enter a positive amount with at most 2 decimal places",
  })
  .transform((v) => parseAmountToMinor(v)!);

/** Money amount that may be negative (savings withdrawals), non-zero. */
export const signedAmountSchema = z
  .string()
  .trim()
  .refine(
    (v) => {
      const raw = v.startsWith("-") ? v.slice(1) : v;
      const minor = parseAmountToMinor(raw);
      return minor !== null && minor > 0;
    },
    { message: "Enter a non-zero amount with at most 2 decimal places" }
  )
  .transform((v) =>
    v.startsWith("-") ? -parseAmountToMinor(v.slice(1))! : parseAmountToMinor(v)!
  );

export const entryCurrencySchema = z.enum(["USD", "MXN"]);
export const anyCurrencySchema = z.enum(["CRC", "USD", "MXN"]);
export const periodSchema = z.enum(["H1", "H2"]);
export const yearSchema = z.coerce.number().int().min(2000).max(2100);
export const monthSchema = z.coerce.number().int().min(1).max(12);

export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00`).getTime()), {
    message: "Enter a valid date",
  });

export const rateSchema = z
  .string()
  .trim()
  .refine((v) => isValidRate(v), { message: "Enter a positive rate (e.g. 512.35)" });

export const incomeEntrySchema = z.object({
  year: yearSchema,
  month: monthSchema,
  period: periodSchema,
  amount: amountSchema,
  currency: entryCurrencySchema,
  label: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  planned: z.coerce.boolean().default(false),
});

export const expenseSchema = z.object({
  date: isoDateSchema,
  amount: amountSchema,
  currency: entryCurrencySchema,
  categoryId: z.string().min(1, "Choose a category"),
  note: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
});

export const planCellSchema = z.object({
  categoryId: z.string().min(1),
  year: yearSchema,
  month: monthSchema,
  /** Zero clears the cell; positive sets the planned amount. */
  amount: z
    .string()
    .trim()
    .refine((v) => v === "" || parseAmountToMinor(v) !== null, {
      message: "Enter a non-negative amount with at most 2 decimal places",
    })
    .transform((v) => (v === "" ? 0 : parseAmountToMinor(v)!)),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  cost: amountSchema,
  currency: anyCurrencySchema,
});

export const savingsContributionSchema = z.object({
  date: isoDateSchema,
  amount: signedAmountSchema,
  currency: anyCurrencySchema,
  note: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
});

export const settingsSchema = z.object({
  usdToCrcRate: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidRate(v), { message: "Enter a positive rate" })
    .transform((v) => (v === "" ? null : v)),
  mxnToCrcRate: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidRate(v), { message: "Enter a positive rate" })
    .transform((v) => (v === "" ? null : v)),
  reportingCurrency: anyCurrencySchema,
  startingBalance: z
    .string()
    .trim()
    .refine(
      (v) => {
        const raw = v.startsWith("-") ? v.slice(1) : v;
        return raw === "" || parseAmountToMinor(raw) !== null || raw === "0";
      },
      { message: "Enter an amount with at most 2 decimal places" }
    )
    .transform((v) => {
      if (v === "" || v === "0") return 0;
      const negative = v.startsWith("-");
      const minor = parseAmountToMinor(negative ? v.slice(1) : v) ?? 0;
      return negative ? -minor : minor;
    }),
  startingBalanceCurrency: anyCurrencySchema,
});

export const allocationSchema = z.object({
  /** Zero disables project allocation (projections show "no projection"). */
  amount: z
    .string()
    .trim()
    .refine((v) => v === "" || v === "0" || parseAmountToMinor(v) !== null, {
      message: "Enter a non-negative amount with at most 2 decimal places",
    })
    .transform((v) => (v === "" || v === "0" ? 0 : parseAmountToMinor(v)!)),
  currency: anyCurrencySchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

/** Flatten a Zod error into field → first message, for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
