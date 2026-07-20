"use client";

import { useActionState } from "react";
import { updateSettingsAction, updateAllocationAction } from "./actions";
import { initialActionState } from "@/lib/action-state";
import type { Currency } from "@/lib/money";

const CURRENCY_OPTIONS: Currency[] = ["CRC", "USD", "MXN"];

function FormFeedback({ state }: { state: { ok?: boolean; errors?: Record<string, string> } }) {
  if (state.errors?._form) return <p className="error-text">{state.errors._form}</p>;
  if (state.ok) return <p className="mt-1 text-xs text-brand-600">Saved.</p>;
  return null;
}

export function SettingsForm({
  usdToCrcRate,
  mxnToCrcRate,
  reportingCurrency,
  startingBalance,
  startingBalanceCurrency,
}: {
  usdToCrcRate: string;
  mxnToCrcRate: string;
  reportingCurrency: Currency;
  startingBalance: string;
  startingBalanceCurrency: Currency;
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialActionState);
  return (
    <form action={formAction} className="card space-y-4">
      <h2 className="text-base font-semibold">Currency &amp; balance</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="usdToCrcRate" className="field-label">
            USD → CRC rate (₡ per $1)
          </label>
          <input
            id="usdToCrcRate"
            name="usdToCrcRate"
            inputMode="decimal"
            defaultValue={usdToCrcRate}
            placeholder="e.g. 512.35"
            className="field-input"
          />
          {state.errors?.usdToCrcRate && <p className="error-text">{state.errors.usdToCrcRate}</p>}
        </div>
        <div>
          <label htmlFor="mxnToCrcRate" className="field-label">
            MXN → CRC rate (₡ per MX$1)
          </label>
          <input
            id="mxnToCrcRate"
            name="mxnToCrcRate"
            inputMode="decimal"
            defaultValue={mxnToCrcRate}
            placeholder="e.g. 28.10"
            className="field-input"
          />
          {state.errors?.mxnToCrcRate && <p className="error-text">{state.errors.mxnToCrcRate}</p>}
        </div>
        <div>
          <label htmlFor="reportingCurrency" className="field-label">
            Reporting currency
          </label>
          <select
            id="reportingCurrency"
            name="reportingCurrency"
            defaultValue={reportingCurrency}
            className="field-input"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startingBalance" className="field-label">
            Starting balance
          </label>
          <div className="flex gap-2">
            <input
              id="startingBalance"
              name="startingBalance"
              inputMode="decimal"
              defaultValue={startingBalance}
              className="field-input"
            />
            <select
              name="startingBalanceCurrency"
              aria-label="Starting balance currency"
              defaultValue={startingBalanceCurrency}
              className="field-input w-24"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {state.errors?.startingBalance && (
            <p className="error-text">{state.errors.startingBalance}</p>
          )}
        </div>
      </div>
      <FormFeedback state={state} />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

export function AllocationForm({
  amount,
  currency,
}: {
  amount: string;
  currency: Currency;
}) {
  const [state, formAction, pending] = useActionState(updateAllocationAction, initialActionState);
  return (
    <form action={formAction} className="card space-y-4">
      <h2 className="text-base font-semibold">Project allocation per half-month</h2>
      <p className="text-sm text-stone-500">
        A fixed amount set aside for purchase projects every half-month period (H1: days 1–15,
        H2: day 16 to month end). Set 0 to disable projections.
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="allocation-amount" className="field-label">
            Amount per period
          </label>
          <input
            id="allocation-amount"
            name="amount"
            inputMode="decimal"
            defaultValue={amount}
            className="field-input"
          />
          {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
        </div>
        <div>
          <label htmlFor="allocation-currency" className="field-label">
            Currency
          </label>
          <select
            id="allocation-currency"
            name="currency"
            defaultValue={currency}
            className="field-input w-24"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <FormFeedback state={state} />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save allocation"}
      </button>
    </form>
  );
}
