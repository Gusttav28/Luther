"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const MENU_WIDTH = 160;
const MENU_EST_HEIGHT = 140;

function menuPositionFor(button: HTMLElement): { top: number; left: number } {
  const rect = button.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUp = spaceBelow < MENU_EST_HEIGHT + 12;
  const top = openUp
    ? Math.max(8, rect.top - MENU_EST_HEIGHT - 4)
    : Math.min(window.innerHeight - MENU_EST_HEIGHT - 8, rect.bottom + 4);
  const left = Math.max(
    8,
    Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
  );
  return { top, left };
}

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
      {sheet ? (
        <div className="min-w-0 space-y-3">
          <div className="grid min-w-0 grid-cols-2 gap-2.5">
            <div className="min-w-0">
              <label htmlFor={`${idPrefix}-name`} className="field-label">
                Name
              </label>
              <input
                id={`${idPrefix}-name`}
                name="name"
                placeholder="e.g. Groceries"
                className="field-input !px-2.5 !py-2 !text-sm"
              />
              {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
            </div>
            <div className="min-w-0">
              <label htmlFor={`${idPrefix}-amount`} className="field-label">
                Amount
              </label>
              <input
                id={`${idPrefix}-amount`}
                name="amount"
                inputMode="decimal"
                placeholder="0.00"
                className="field-input !px-2.5 !py-2 !text-sm"
              />
              {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
            </div>
          </div>

          <div className="flex min-w-0 items-end gap-2.5">
            <div className="min-w-0 flex-1 overflow-hidden">
              <label htmlFor={`${idPrefix}-date`} className="field-label">
                Date
              </label>
              <input
                id={`${idPrefix}-date`}
                name="date"
                type="date"
                defaultValue={defaultDate}
                className="field-input sheet-date-input !px-2 !py-2 !text-sm"
              />
              {state.errors?.date && <p className="error-text">{state.errors.date}</p>}
            </div>
            <div className="w-[4.75rem] shrink-0">
              <label htmlFor={`${idPrefix}-currency`} className="field-label">
                Currency
              </label>
              <select
                id={`${idPrefix}-currency`}
                name="currency"
                className="field-input !px-1.5 !py-2 !text-sm"
                defaultValue="CRC"
              >
                {ENTRY_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="min-w-0">
            <CategoryPicker
              categories={categories}
              errors={state.errors}
              idPrefix="sheet-add-expense-cat"
            />
          </div>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-name`} className="field-label">
              Expense name
            </label>
            <input
              id={`${idPrefix}-name`}
              name="name"
              placeholder="e.g. Groceries at Walmart"
              className="field-input"
            />
            {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
          </div>
          <div className="min-w-0">
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
          <div className="min-w-0">
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
          <div className="min-w-0">
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
          <div className="col-span-2 min-w-0">
            <CategoryPicker
              categories={categories}
              errors={state.errors}
              idPrefix="add-expense-cat"
            />
          </div>
        </div>
      )}
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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function closeMenu() {
    setMenuOpen(false);
    setMenuPos(null);
  }

  function toggleMenu() {
    if (menuOpen) {
      closeMenu();
      return;
    }
    const button = menuButtonRef.current;
    if (!button) return;
    setMenuPos(menuPositionFor(button));
    setMenuOpen(true);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    const onRepositionClose = () => closeMenu();
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onRepositionClose);
    window.addEventListener("scroll", onRepositionClose, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onRepositionClose);
      window.removeEventListener("scroll", onRepositionClose, true);
    };
  }, [menuOpen]);

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

  const menu =
    menuOpen && menuPos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Expense actions"
            className="fixed z-50 w-40 rounded-xl border border-line bg-surface-elevated p-1 shadow-card md:hidden"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
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
              role="menuitem"
              onClick={() => {
                closeMenu();
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
          </div>,
          document.body
        )
      : null;

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

        {/* Mobile ⋮ menu — portaled so list/card overflow cannot clip it */}
        <div className="md:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Expense actions"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={toggleMenu}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
          {menu}
        </div>
      </div>
    </li>
  );
}
