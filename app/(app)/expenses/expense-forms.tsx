"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
  setExpenseCompletedAction,
} from "./actions";
import { initialActionState } from "@/lib/action-state";
import { formatMinor, CURRENCY_LABELS, type Currency } from "@/lib/money";
import { Money } from "@/components/money";
import { CategoryPicker, type CategoryOption } from "@/components/category-picker";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import type { ExpenseRow } from "@/lib/queries/expenses";

const ENTRY_CURRENCIES: Currency[] = ["CRC", "USD"];

export function AddExpenseForm({
  categories,
  defaultDate,
}: {
  categories: CategoryOption[];
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(createExpenseAction, initialActionState);
  return (
    <form action={formAction} className="card space-y-3">
      <h2 className="text-base font-semibold">Add expense</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="expense-name" className="field-label">
            Expense name
          </label>
          <input
            id="expense-name"
            name="name"
            placeholder="e.g. Groceries at Walmart"
            className="field-input"
          />
          {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
        </div>
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
          <select id="expense-currency" name="currency" className="field-input" defaultValue="CRC">
            {ENTRY_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <CategoryPicker categories={categories} errors={state.errors} idPrefix="add-expense-cat" />
        </div>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <PendingSubmitButton
        idle="Add expense"
        className="btn-primary min-w-[8rem]"
        pendingLabel="Adding"
      />
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
  const [state, formAction] = useActionState(updateExpenseAction, initialActionState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);
  const dateStr = expense.date.toISOString().slice(0, 10);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={expense.id} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <input
          name="name"
          defaultValue={expense.name ?? ""}
          aria-label="Expense name"
          placeholder="Expense name"
          className="field-input"
        />
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
              {CURRENCY_LABELS[c]}
            </option>
          ))}
        </select>
        <div className="sm:col-span-2">
          <CategoryPicker
            categories={categories}
            defaultCategoryId={expense.categoryId}
            defaultCategoryName={expense.categoryName}
            errors={state.errors}
            idPrefix={`edit-${expense.id}`}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <PendingSubmitButton idle="Save" className="btn-primary min-w-[4.5rem] px-3 py-1.5" pendingLabel="Saving" />
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
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
    <li
      className={`flex items-center justify-between gap-3 py-3 ${
        expense.completed ? "" : "opacity-70"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{expense.name || expense.categoryName}</p>
        <p className="text-xs text-stone-500">
          {expense.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
          {expense.categoryName}
          {expense.completed ? "" : " · Not complete"}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
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
        <form action={setExpenseCompletedAction}>
          <input type="hidden" name="id" value={expense.id} />
          <input type="hidden" name="completed" value="true" />
          <PendingSubmitButton
            idle="Complete"
            className={`px-2 py-1 text-xs ${
              expense.completed ? "btn-primary" : "btn-secondary"
            }`}
            pendingLabel="Saving"
          />
        </form>
        <form action={setExpenseCompletedAction}>
          <input type="hidden" name="id" value={expense.id} />
          <input type="hidden" name="completed" value="false" />
          <PendingSubmitButton
            idle="Not complete"
            className={`whitespace-nowrap px-2 py-1 text-xs ${
              expense.completed ? "btn-secondary" : "btn-primary"
            }`}
            pendingLabel="Saving"
          />
        </form>
        <button onClick={() => setEditing(true)} className="btn-secondary px-2 py-1 text-xs">
          Edit
        </button>
        <form action={deleteExpenseAction}>
          <input type="hidden" name="id" value={expense.id} />
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
