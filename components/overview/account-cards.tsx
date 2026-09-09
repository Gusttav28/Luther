import { Money } from "@/components/money";
import type { Currency } from "@/lib/money";

const HINT =
  "70% is saved only after Main covers this month’s remaining planned expenses. Charging a bill lowers Main and Planned expenses.";

export function AccountCards({
  mainAccountMinor,
  savingsAccountMinor,
  plannedExpensesMinor,
  currency,
  compact = false,
}: {
  mainAccountMinor: number | null;
  savingsAccountMinor: number | null;
  plannedExpensesMinor: number | null;
  currency: Currency;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <section className="card !rounded-[20px] !px-5 !py-5" aria-label="Accounts">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              Main account
            </p>
            <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight text-ink">
              <Money minor={mainAccountMinor} currency={currency} />
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              Savings account
            </p>
            <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight text-ink">
              <Money minor={savingsAccountMinor} currency={currency} />
            </p>
          </div>
        </div>
        <div className="mt-[18px] flex items-center justify-between border-t border-line pt-3.5">
          <span className="text-[12.5px] text-ink-muted">Planned expenses</span>
          <span className="text-[15px] font-semibold tabular-nums text-ink">
            <Money minor={plannedExpensesMinor} currency={currency} />
          </span>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">{HINT}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-label="Accounts">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card ring-1 ring-brand-100 dark:ring-white/20">
          <p className="field-label">Main account</p>
          <p className="text-xl font-bold tabular-nums tracking-tight text-brand-accent sm:text-2xl">
            <Money minor={mainAccountMinor} currency={currency} />
          </p>
        </div>
        <div className="card">
          <p className="field-label">Savings account</p>
          <p className="text-xl font-bold tabular-nums tracking-tight text-ink sm:text-2xl">
            <Money minor={savingsAccountMinor} currency={currency} />
          </p>
        </div>
        <div className="card">
          <p className="field-label">Planned expenses</p>
          <p className="text-xl font-bold tabular-nums tracking-tight text-ink sm:text-2xl">
            <Money minor={plannedExpensesMinor} currency={currency} />
          </p>
        </div>
      </div>
      <p className="text-sm text-ink-muted">{HINT}</p>
    </section>
  );
}
