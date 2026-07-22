"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createSavingsAction, updateSavingsAction, deleteSavingsAction } from "./actions";
import { initialActionState } from "@/lib/action-state";
import { formatMinor, type Currency } from "@/lib/money";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import type { SavingsRow } from "@/lib/queries/savings";

const CURRENCY_OPTIONS: Currency[] = ["CRC", "USD"];

export function AddSavingsForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction] = useActionState(createSavingsAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="card space-y-3">
      <h2 className="text-base font-semibold">Manual adjustment</h2>
      <p className="text-sm text-ink-muted">
        Lifetime savings of 70% are calculated automatically. Use this form only for corrections
        or withdrawals (negative amount, e.g. -50).
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="savings-date" className="field-label">
            Date
          </label>
          <input
            id="savings-date"
            name="date"
            type="date"
            defaultValue={defaultDate}
            className="field-input"
          />
          {state.errors?.date && <p className="error-text">{state.errors.date}</p>}
        </div>
        <div>
          <label htmlFor="savings-amount" className="field-label">
            Amount
          </label>
          <input
            id="savings-amount"
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            className="field-input"
          />
          {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
        </div>
        <div>
          <label htmlFor="savings-currency" className="field-label">
            Currency
          </label>
          <select id="savings-currency" name="currency" className="field-input" defaultValue="CRC">
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="savings-note" className="field-label">
            Note (optional)
          </label>
          <input id="savings-note" name="note" className="field-input" />
        </div>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <PendingSubmitButton idle="Record" className="btn-primary min-w-[5.5rem]" pendingLabel="Recording" />
    </form>
  );
}

function EditSavingsForm({ row, onDone }: { row: SavingsRow; onDone: () => void }) {
  const [state, formAction] = useActionState(updateSavingsAction, initialActionState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);
  const dateStr = row.date.toISOString().slice(0, 10);
  const amountStr =
    row.amountMinor < 0
      ? `-${(Math.abs(row.amountMinor) / 100).toFixed(2)}`
      : (row.amountMinor / 100).toFixed(2);
  return (
    <form action={formAction} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <input type="hidden" name="id" value={row.id} />
      <input type="date" name="date" defaultValue={dateStr} aria-label="Date" className="field-input" />
      <div>
        <input
          name="amount"
          inputMode="decimal"
          aria-label="Amount"
          defaultValue={amountStr}
          className="field-input"
        />
        {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
      </div>
      <select name="currency" defaultValue={row.currency} aria-label="Currency" className="field-input">
        {CURRENCY_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input name="note" defaultValue={row.note ?? ""} aria-label="Note" className="field-input" />
      <div className="flex items-center gap-2">
        <PendingSubmitButton idle="Save" className="btn-primary min-w-[4.5rem] px-3 py-1.5" pendingLabel="Saving" />
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
      </div>
      {state.errors?._form && <p className="error-text col-span-full">{state.errors._form}</p>}
    </form>
  );
}

export function SavingsListRow({ row }: { row: SavingsRow }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li className="py-3">
        <EditSavingsForm row={row} onDone={() => setEditing(false)} />
      </li>
    );
  }
  const isWithdrawal = row.amountMinor < 0;
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {row.note || (isWithdrawal ? "Withdrawal" : "Contribution")}
        </p>
        <p className="text-xs text-stone-500">
          {row.date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-semibold tabular-nums ${
            isWithdrawal ? "text-red-600 dark:text-red-400" : "text-brand-accent"
          }`}
        >
          {formatMinor(row.amountMinor, row.currency)}
        </span>
        <button onClick={() => setEditing(true)} className="btn-secondary px-2 py-1 text-xs">
          Edit
        </button>
        <form action={deleteSavingsAction}>
          <input type="hidden" name="id" value={row.id} />
          <PendingSubmitButton
            idle="Delete"
            className="btn-danger min-w-[3.5rem] px-2 py-1 text-xs"
            pendingLabel="Deleting"
          />
        </form>
      </div>
    </li>
  );
}
