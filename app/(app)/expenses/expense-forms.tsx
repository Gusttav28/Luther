"use client";

import { useActionState, useEffect, useState } from "react";
import { createExpenseAction, updateExpenseAction, deleteExpenseAction } from "./actions";
import { initialActionState } from "@/lib/action-state";
import { formatMinor, type Currency } from "@/lib/money";
import { Money } from "@/components/money";
import type { ExpenseRow } from "@/lib/queries/expenses";

const ENTRY_CURRENCIES: Currency[] = ["USD", "MXN"];

export interface CategoryOption {
  id: string;
  name: string;
}

export function AddExpenseForm({
  categories,
  defaultDate,
}: {
  categories: CategoryOption[];
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(createExpenseAction, initialActionState);
  return (
    <form action={formAction} className="card space-y-3">
      <h2 className="text-base font-semibold">Add expense</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div>
          <label htmlFor="expense-date" className="field-label">
            Date
          </label>
          <input
            id="expense-date"
            name="date"
            type="date"
            defaultValue={defaultDate}
            className="field-input"
          />
          {state.errors?.date && <p className="error-text">{state.errors.date}</p>}
        </div>
        <div>
          <label htmlFor="expense-amount" className="field-label">
            Amount
          </label>
          <input
            id="expense-amount"
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            className="field-input"
          />
          {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
        </div>
        <div>
          <label htmlFor="expense-currency" className="field-label">
            Currency
          </label>
          <select id="expense-currency" name="currency" className="field-input" defaultValue="USD">
            {ENTRY_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expense-category" className="field-label">
            Category
          </label>
          <select id="expense-category" name="categoryId" className="field-input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state.errors?.categoryId && <p className="error-text">{state.errors.categoryId}</p>}
        </div>
        <div>
          <label htmlFor="expense-note" className="field-label">
            Note (optional)
          </label>
          <input id="expense-note" name="note" className="field-input" />
        </div>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adding…" : "Add expense"}
      </button>
    </form>
  );
}

function EditExpenseForm({
  expense,
  categories,
  onDone,
}: {
  expense: ExpenseRow;
  categories: CategoryOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateExpenseAction, initialActionState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);
  const dateStr = expense.date.toISOString().slice(0, 10);
  return (
    <form action={formAction} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
      <input type="hidden" name="id" value={expense.id} />
      <input type="date" name="date" defaultValue={dateStr} aria-label="Date" className="field-input" />
      <div>
        <input
          name="amount"
          inputMode="decimal"
          aria-label="Amount"
          defaultValue={(expense.amountMinor / 100).toFixed(2)}
          className="field-input"
        />
        {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
      </div>
      <select name="currency" defaultValue={expense.currency} aria-label="Currency" className="field-input">
        {ENTRY_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        name="categoryId"
        defaultValue={expense.categoryId}
        aria-label="Category"
        className="field-input"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input name="note" defaultValue={expense.note ?? ""} aria-label="Note" className="field-input" />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn-primary px-3 py-1.5">
          Save
        </button>
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
      </div>
      {state.errors?._form && <p className="error-text col-span-full">{state.errors._form}</p>}
    </form>
  );
}

export function ExpenseListRow({
  expense,
  categories,
  reportingCurrency,
}: {
  expense: ExpenseRow;
  categories: CategoryOption[];
  reportingCurrency: Currency;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li className="py-3">
        <EditExpenseForm expense={expense} categories={categories} onDone={() => setEditing(false)} />
      </li>
    );
  }
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {expense.note || expense.categoryName}
        </p>
        <p className="text-xs text-stone-500">
          {expense.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
          {expense.categoryName}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {formatMinor(expense.amountMinor, expense.currency)}
          </p>
          {expense.currency !== reportingCurrency && (
            <p className="text-xs text-stone-500 tabular-nums">
              <Money minor={expense.convertedMinor} currency={reportingCurrency} />
            </p>
          )}
        </div>
        <button onClick={() => setEditing(true)} className="btn-secondary px-2 py-1 text-xs">
          Edit
        </button>
        <form action={deleteExpenseAction}>
          <input type="hidden" name="id" value={expense.id} />
          <button type="submit" className="btn-danger px-2 py-1 text-xs">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
