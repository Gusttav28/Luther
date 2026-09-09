import { Money } from "@/components/money";
import type { Currency } from "@/lib/money";

const HINT =
  "Savings only move after received salary and reserved upcoming bills. From planned salary updates when pay arrives or something is charged.";

export function AccountCards({
  mainAccountMinor,
  savingsAccountMinor,
  savedFromPlannedMinor,
  currency,
  compact = false,
}: {
  mainAccountMinor: number | null;
  savingsAccountMinor: number | null;
  savedFromPlannedMinor: number | null;
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
          <span className="text-[12.5px] text-ink-muted">From planned salary</span>
          <span className="text-[15px] font-semibold tabular-nums text-ink">
            <Money minor={savedFromPlannedMinor} currency={currency} />
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
          <p className="field-label">From planned salary</p>
          <p className="text-xl font-bold tabular-nums tracking-tight text-ink sm:text-2xl">
            <Money minor={savedFromPlannedMinor} currency={currency} />
          </p>
        </div>
      </div>
      <p className="text-sm text-ink-muted">{HINT}</p>
    </section>
  );
}
