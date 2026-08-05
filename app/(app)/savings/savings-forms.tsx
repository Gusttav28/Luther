"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createSavingsAction, updateSavingsAction, deleteSavingsAction } from "./actions";
import { initialActionState } from "@/lib/action-state";
import { formatMinor, type Currency } from "@/lib/money";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import type { SavingsRow } from "@/lib/queries/savings";

const CURRENCY_OPTIONS: Currency[] = ["CRC", "USD"];

export function AddSavingsForm({
  defaultDate,
  variant = "card",
  onSuccess,
}: {
  defaultDate: string;
  variant?: "card" | "sheet";
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(createSavingsAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const sheet = variant === "sheet";
  const idPrefix = sheet ? "sheet-savings" : "savings";

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={sheet ? "space-y-4" : "card space-y-3"}
    >
      {sheet ? (
        <p className="text-sm text-ink-muted">
          Lifetime savings of 70% are calculated automatically. Use this only for corrections or
          withdrawals (negative amount, e.g. -50).
        </p>
      ) : (
        <>
          <h2 className="text-base font-semibold">Manual adjustment</h2>
          <p className="text-sm text-ink-muted">
            Lifetime savings of 70% are calculated automatically. Use this form only for corrections
            or withdrawals (negative amount, e.g. -50).
          </p>
        </>
      )}
      <div className={`grid grid-cols-2 gap-3 ${sheet ? "" : "sm:grid-cols-4"}`}>
        <div className={sheet ? "col-span-2" : ""}>
          <label htmlFor={`${idPrefix}-date`} className="field-label">
            Date
          </label>
          <input
            id={`${idPrefix}-date`}
            name="date"
            type="date"
            defaultValue={defaultDate}
            className="field-input"
          />
          {state.errors?.date && <p className="error-text">{state.errors.date}</p>}
        </div>
        <div className={sheet ? "col-span-2" : ""}>
          <label htmlFor={`${idPrefix}-amount`} className="field-label">
            Amount
          </label>
          <input
            id={`${idPrefix}-amount`}
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            className="field-input"
          />
          {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
        </div>
        <div className={sheet ? "col-span-2" : ""}>
          <label htmlFor={`${idPrefix}-currency`} className="field-label">
            Currency
          </label>
          <select
            id={`${idPrefix}-currency`}
            name="currency"
            className="field-input"
            defaultValue="CRC"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className={sheet ? "col-span-2" : ""}>
          <label htmlFor={`${idPrefix}-note`} className="field-label">
            Note (optional)
          </label>
          <input id={`${idPrefix}-note`} name="note" className="field-input" />
        </div>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <PendingSubmitButton
        idle="Record"
        className={
          sheet
            ? "btn-primary w-full !rounded-xl !bg-neutral-900 py-3 text-base font-semibold dark:!bg-neutral-100 dark:!text-neutral-900"
            : "btn-primary min-w-[5.5rem]"
        }
        pendingLabel="Recording"
      />
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
  const title =
    row.note ||
    (isWithdrawal
      ? "Withdrawal"
      : "Lifetime savings (70% of leftover after expenses)");
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-muted">
          {row.date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span
          className={`text-sm font-semibold tabular-nums ${
            isWithdrawal ? "text-red-600 dark:text-red-400" : "text-ink"
          }`}
        >
          {formatMinor(row.amountMinor, row.currency)}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn-secondary px-2 py-1 text-xs"
        >
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
