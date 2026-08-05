"use client";

import { useActionState, useEffect, useState } from "react";
import { MoreVertical } from "lucide-react";
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
  variant = "card",
  onSuccess,
}: {
  categories: CategoryOption[];
  defaultDate: string;
  variant?: "card" | "sheet";
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(createExpenseAction, initialActionState);
  const sheet = variant === "sheet";
  const idPrefix = sheet ? "sheet-expense" : "expense";

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className={sheet ? "space-y-4" : "card space-y-3"}>
      {sheet ? null : <h2 className="text-base font-semibold">Add expense</h2>}
      <div className={`grid grid-cols-2 gap-3 ${sheet ? "" : "sm:grid-cols-3"}`}>
        <div>
          <label htmlFor={`${idPrefix}-name`} className="field-label">
            {sheet ? "Name" : "Expense name"}
          </label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            placeholder={sheet ? "e.g. Groceries" : "e.g. Groceries at Walmart"}
            className="field-input"
          />
          {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
        </div>
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
        <div className="col-span-2">
          <CategoryPicker
            categories={categories}
            errors={state.errors}
            idPrefix={sheet ? "sheet-add-expense-cat" : "add-expense-cat"}
          />
        </div>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <PendingSubmitButton
        idle="Add expense"
        className={
          sheet
            ? "btn-primary w-full !rounded-xl !bg-neutral-900 py-3 text-base font-semibold dark:!bg-neutral-100 dark:!text-neutral-900"
            : "btn-primary min-w-[8rem]"
        }
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
  const [menuOpen, setMenuOpen] = useState(false);
  if (editing) {
    return (
      <li className="py-3">
        <EditExpenseForm expense={expense} categories={categories} onDone={() => setEditing(false)} />
      </li>
    );
  }

  const dateLabel = expense.date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <li
      className={`flex items-center justify-between gap-3 py-3 ${
        expense.completed ? "" : "md:opacity-70"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {expense.name || expense.categoryName}
            </p>
            <p className="text-xs text-ink-muted">
              <span className="md:hidden">
                {dateLabel} · {expense.categoryName}
              </span>
              <span className="hidden md:inline">
                {expense.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                {expense.categoryName}
                {expense.completed ? "" : " · Not complete"}
              </span>
            </p>
          </div>
          <span
            className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide md:hidden ${
              expense.completed
                ? "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {expense.completed ? "Done" : "Pending"}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-ink">
            {formatMinor(expense.amountMinor, expense.currency)}
          </p>
          {expense.currency !== reportingCurrency && (
            <p className="text-xs tabular-nums text-ink-muted">
              <Money minor={expense.convertedMinor} currency={reportingCurrency} />
            </p>
          )}
        </div>

        {/* Desktop action buttons */}
        <div className="hidden flex-wrap items-center justify-end gap-2 md:flex">
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
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn-secondary px-2 py-1 text-xs"
          >
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

        {/* Mobile ⋮ menu */}
        <div className="relative md:hidden">
          <button
            type="button"
            aria-label="Expense actions"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-line bg-surface-elevated p-1 shadow-card">
              <form action={setExpenseCompletedAction}>
                <input type="hidden" name="id" value={expense.id} />
                <input
                  type="hidden"
                  name="completed"
                  value={expense.completed ? "false" : "true"}
                />
                <PendingSubmitButton
                  idle={expense.completed ? "Mark pending" : "Mark done"}
                  className="w-full justify-start rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted"
                  pendingLabel="Saving"
                />
              </form>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setEditing(true);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted"
              >
                Edit
              </button>
              <form action={deleteExpenseAction}>
                <input type="hidden" name="id" value={expense.id} />
                <PendingSubmitButton
                  idle="Delete"
                  className="w-full justify-start rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  pendingLabel="Deleting"
                />
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
