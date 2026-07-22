"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "./actions";
import { initialActionState } from "@/lib/action-state";
import { CURRENCY_LABELS, type Currency } from "@/lib/money";
import { PendingSubmitButton } from "@/components/pending-submit-button";

const CURRENCY_OPTIONS: Currency[] = ["CRC", "USD"];

function FormFeedback({ state }: { state: { ok?: boolean; errors?: Record<string, string> } }) {
  if (state.errors?._form) return <p className="error-text">{state.errors._form}</p>;
  if (state.ok) return <p className="mt-1 text-xs text-brand-accent">Saved.</p>;
  return null;
}

export function SettingsForm({
  usdToCrcRate,
  reportingCurrency,
  startingBalance,
  startingBalanceCurrency,
}: {
  usdToCrcRate: string;
  reportingCurrency: Currency;
  startingBalance: string;
  startingBalanceCurrency: Currency;
}) {
  const [state, formAction] = useActionState(updateSettingsAction, initialActionState);
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
                {CURRENCY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
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
              className="field-input w-36"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
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
      <PendingSubmitButton
        idle="Save settings"
        className="btn-primary min-w-[8rem]"
        pendingLabel="Saving"
      />
    </form>
  );
}
