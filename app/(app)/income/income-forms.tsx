"use client";

import { useActionState, useEffect, useState } from "react";
import { createIncomeAction, updateIncomeAction, deleteIncomeAction } from "./actions";
import { initialActionState } from "@/lib/action-state";
import { formatMinor, CURRENCY_LABELS, type Currency } from "@/lib/money";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import type { IncomeRow } from "@/lib/queries/income";

const ENTRY_CURRENCIES: Currency[] = ["CRC", "USD"];

export function AddIncomeForm({
  year,
  month,
  variant = "card",
  defaultPeriod = "H1",
  onSuccess,
}: {
  year: number;
  month: number;
  variant?: "card" | "sheet";
  defaultPeriod?: "H1" | "H2";
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(createIncomeAction, initialActionState);
  const [period, setPeriod] = useState<"H1" | "H2">(defaultPeriod);
  const sheet = variant === "sheet";
  const idPrefix = sheet ? "sheet-income" : "income";

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className={sheet ? "space-y-4" : "card space-y-3"}>
      {sheet ? null : <h2 className="text-base font-semibold">Add income</h2>}
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="period" value={period} />

      {sheet ? (
        <div>
          <p className="field-label">Period</p>
          <div
            className="mt-1.5 grid grid-cols-2 gap-2"
            role="group"
            aria-label="Income period"
          >
            {(
              [
                { key: "H1", label: "H1 (1–15)" },
                { key: "H2", label: "H2 (16–end)" },
              ] as const
            ).map((opt) => {
              const selected = period === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPeriod(opt.key)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    selected
                      ? "border-brand-700 bg-brand-50 text-brand-900 dark:border-brand-500 dark:bg-brand-950 dark:text-brand-100"
                      : "border-line bg-surface-card text-ink-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {state.errors?.period && <p className="error-text">{state.errors.period}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-period`} className="field-label whitespace-nowrap">
              Period
            </label>
            <select
              id={`${idPrefix}-period`}
              className="field-input"
              value={period}
              onChange={(e) => setPeriod(e.target.value as "H1" | "H2")}
            >
              <option value="H1">H1 (1–15)</option>
              <option value="H2">H2 (16–end)</option>
            </select>
            {state.errors?.period && <p className="error-text">{state.errors.period}</p>}
          </div>
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-amount`} className="field-label whitespace-nowrap">
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
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-currency`} className="field-label whitespace-nowrap">
              Currency
            </label>
            <select
              id={`${idPrefix}-currency`}
              name="currency"
              className="field-input"
              defaultValue="CRC"
            >
              {ENTRY_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-label`} className="field-label whitespace-nowrap">
              Label (optional)
            </label>
            <input
              id={`${idPrefix}-label`}
              name="label"
              className="field-input"
              placeholder="Source"
            />
          </div>
        </div>
      )}

      {sheet ? (
        <>
          <div>
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
          <div>
            <label htmlFor={`${idPrefix}-currency`} className="field-label">
              Currency
            </label>
            <select
              id={`${idPrefix}-currency`}
              name="currency"
              className="field-input"
              defaultValue="CRC"
            >
              {ENTRY_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-label`} className="field-label">
              Label (optional)
            </label>
            <input
              id={`${idPrefix}-label`}
              name="label"
              className="field-input"
              placeholder="Source"
            />
          </div>
        </>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-ink-secondary">
        <input type="checkbox" name="planned" className="rounded border-line" />
        Planned (not yet received)
      </label>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <PendingSubmitButton
        idle="Add income"
        className={
          sheet
            ? "btn-primary w-full !rounded-xl !bg-neutral-900 py-3 text-base font-semibold dark:!bg-neutral-100 dark:!text-neutral-900"
            : "btn-primary min-w-[7rem]"
        }
        pendingLabel="Adding"
      />
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
  const [state, formAction] = useActionState(updateIncomeAction, initialActionState);
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
            {CURRENCY_LABELS[c]}
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
        <PendingSubmitButton idle="Save" className="btn-primary min-w-[4.5rem] px-3 py-1.5" pendingLabel="Saving" />
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
