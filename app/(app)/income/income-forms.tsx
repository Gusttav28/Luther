"use client";

import { useActionState, useEffect, useState } from "react";
import { createIncomeAction, updateIncomeAction, deleteIncomeAction } from "./actions";
import { initialActionState } from "@/lib/action-state";
import { formatMinor, type Currency } from "@/lib/money";
import type { IncomeRow } from "@/lib/queries/income";

const ENTRY_CURRENCIES: Currency[] = ["USD", "MXN"];

export function AddIncomeForm({ year, month }: { year: number; month: number }) {
  const [state, formAction, pending] = useActionState(createIncomeAction, initialActionState);
  return (
    <form action={formAction} className="card space-y-3">
      <h2 className="text-base font-semibold">Add income</h2>
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="income-period" className="field-label">
            Period
          </label>
          <select id="income-period" name="period" className="field-input" defaultValue="H1">
            <option value="H1">H1 (1–15)</option>
            <option value="H2">H2 (16–end)</option>
          </select>
          {state.errors?.period && <p className="error-text">{state.errors.period}</p>}
        </div>
        <div>
          <label htmlFor="income-amount" className="field-label">
            Amount
          </label>
          <input
            id="income-amount"
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            className="field-input"
          />
          {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
        </div>
        <div>
          <label htmlFor="income-currency" className="field-label">
            Currency
          </label>
          <select id="income-currency" name="currency" className="field-input" defaultValue="USD">
            {ENTRY_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="income-label" className="field-label">
            Label (optional)
          </label>
          <input id="income-label" name="label" className="field-input" placeholder="Source" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" name="planned" className="rounded border-stone-300" />
        Planned (not yet received)
      </label>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adding…" : "Add income"}
      </button>
    </form>
  );
}

function EditIncomeForm({
  entry,
  year,
  month,
  onDone,
}: {
  entry: IncomeRow;
  year: number;
  month: number;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateIncomeAction, initialActionState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);
  return (
    <form action={formAction} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <input type="hidden" name="id" value={entry.id} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <select name="period" defaultValue={entry.period} aria-label="Period" className="field-input">
        <option value="H1">H1</option>
        <option value="H2">H2</option>
      </select>
      <div>
        <input
          name="amount"
          inputMode="decimal"
          aria-label="Amount"
          defaultValue={(entry.amountMinor / 100).toFixed(2)}
          className="field-input"
        />
        {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
      </div>
      <select
        name="currency"
        defaultValue={entry.currency}
        aria-label="Currency"
        className="field-input"
      >
        {ENTRY_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        name="label"
        defaultValue={entry.label ?? ""}
        aria-label="Label"
        className="field-input"
      />
      <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
        <label className="flex items-center gap-1 text-xs text-stone-600">
          <input
            type="checkbox"
            name="planned"
            defaultChecked={entry.planned}
            className="rounded border-stone-300"
          />
          Planned
        </label>
        <button type="submit" disabled={pending} className="btn-primary px-3 py-1.5">
          Save
        </button>
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
      </div>
      {state.errors?._form && (
        <p className="error-text col-span-full">{state.errors._form}</p>
      )}
    </form>
  );
}

export function IncomeEntryRow({
  entry,
  year,
  month,
}: {
  entry: IncomeRow;
  year: number;
  month: number;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li className="py-3">
        <EditIncomeForm entry={entry} year={year} month={month} onDone={() => setEditing(false)} />
      </li>
    );
  }
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {entry.label || "Income"}
          {entry.planned && (
            <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-stone-600">
              planned
            </span>
          )}
        </p>
        <p className="text-xs text-stone-500">{entry.period === "H1" ? "1st–15th" : "16th–end"}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums">
          {formatMinor(entry.amountMinor, entry.currency)}
        </span>
        <button onClick={() => setEditing(true)} className="btn-secondary px-2 py-1 text-xs">
          Edit
        </button>
        <form action={deleteIncomeAction}>
          <input type="hidden" name="id" value={entry.id} />
          <button type="submit" className="btn-danger px-2 py-1 text-xs">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
