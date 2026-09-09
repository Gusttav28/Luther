"use client";

import { useState } from "react";
import { Money } from "@/components/money";
import type { Currency } from "@/lib/money";
import type { BalanceAccountView, SavingsMonthBreakdown } from "@/lib/queries/accounts";
import {
  CustomDeleteForm,
  CustomEntryForm,
  CustomRenameForm,
  MainOpeningForm,
} from "@/app/(app)/balance/account-forms";

const SAVINGS_COPY =
  "70% of Main after remaining planned expenses. If those bills cover Main, nothing is saved this month.";

function KindLabel({ kind }: { kind: BalanceAccountView["kind"] }) {
  if (kind === "MAIN") return "Main account";
  if (kind === "SAVINGS") return "Savings account";
  return "Custom";
}

function MainAccountCard({
  account,
  compact,
}: {
  account: BalanceAccountView;
  compact: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const amountClass = `font-bold tabular-nums tracking-tight ${
    compact ? "text-[22px]" : "text-xl sm:text-2xl"
  } text-ink`;

  if (editing) {
    return (
      <MainOpeningForm
        accountId={account.id}
        openingPrefill={(account.openingMinor / 100).toFixed(2)}
        currency={account.currency}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="mt-1 flex items-center justify-between gap-3">
      <p className={amountClass}>
        <Money minor={account.openingMinor} currency={account.currency} />
      </p>
      <button
        type="button"
        className="btn-secondary shrink-0 px-2 py-1 text-xs"
        onClick={() => setEditing(true)}
      >
        Edit
      </button>
    </div>
  );
}

export function AccountCards({
  accounts,
  breakdown,
  leftoverHintMinor,
  currency,
  defaultDate,
  compact = false,
}: {
  accounts: BalanceAccountView[];
  breakdown: SavingsMonthBreakdown;
  leftoverHintMinor: number | null;
  currency: Currency;
  defaultDate: string;
  compact?: boolean;
}) {
  if (accounts.length === 0) return null;

  return (
    <div className={compact ? "space-y-3" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
      {accounts.map((account) => (
        <article
          key={account.id}
          className={
            compact
              ? "rounded-[14px] bg-[#f6f7f5] p-3.5 dark:bg-surface-muted"
              : "card"
          }
        >
          <p className="field-label">
            <KindLabel kind={account.kind} />
          </p>
          <h3 className="text-base font-semibold text-ink">{account.name}</h3>
          {account.kind === "MAIN" ? (
            <MainAccountCard
              key={`${account.openingMinor}-${account.currency}`}
              account={account}
              compact={compact}
            />
          ) : (
            <p
              className={`mt-1 font-bold tabular-nums tracking-tight ${
                compact ? "text-[22px]" : "text-xl sm:text-2xl"
              } text-ink`}
            >
              <Money minor={account.balanceMinor} currency={currency} />
            </p>
          )}

          {account.kind === "SAVINGS" ? (
            <dl className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">This month (70%)</dt>
                <dd className="font-semibold tabular-nums">
                  <Money minor={breakdown.fromMain} currency={currency} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Leftover after save</dt>
                <dd className="font-semibold tabular-nums">
                  <Money minor={leftoverHintMinor} currency={currency} />
                </dd>
              </div>
              <p className="pt-1 text-xs leading-relaxed text-ink-muted">{SAVINGS_COPY}</p>
            </dl>
          ) : null}

          {account.kind === "CUSTOM" ? (
            <>
              <p className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-muted">Available leftover this month</span>
                <span className="font-semibold tabular-nums">
                  <Money minor={leftoverHintMinor} currency={currency} />
                </span>
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Hint only — leftover is not moved automatically.
              </p>
              <CustomEntryForm
                accountId={account.id}
                defaultDate={defaultDate}
                defaultCurrency={currency}
              />
              <CustomRenameForm accountId={account.id} name={account.name} />
              <CustomDeleteForm accountId={account.id} name={account.name} />
            </>
          ) : null}
        </article>
      ))}
    </div>
  );
}
