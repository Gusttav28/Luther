"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createAccountAction,
  createAccountEntryAction,
  deleteCustomAccountAction,
  renameCustomAccountAction,
  updateMainOpeningAction,
} from "./actions";
import { initialActionState } from "@/lib/action-state";
import { CURRENCY_LABELS, type Currency } from "@/lib/money";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import type { AccountKind } from "@/lib/queries/accounts";

const CURRENCY_OPTIONS: Currency[] = ["CRC", "USD"];

function firstOpenKind(hasMain: boolean, hasSavings: boolean): AccountKind {
  if (!hasMain) return "MAIN";
  if (!hasSavings) return "SAVINGS";
  return "CUSTOM";
}

function resolvedKind(
  choice: AccountKind | null,
  hasMain: boolean,
  hasSavings: boolean
): AccountKind {
  const fallback = firstOpenKind(hasMain, hasSavings);
  if (choice === "MAIN" && hasMain) return fallback;
  if (choice === "SAVINGS" && hasSavings) return fallback;
  return choice ?? fallback;
}

function KindPicker({
  value,
  onChange,
  hasMain,
  hasSavings,
  idPrefix,
}: {
  value: AccountKind;
  onChange: (kind: AccountKind) => void;
  hasMain: boolean;
  hasSavings: boolean;
  idPrefix: string;
}) {
  const options: Array<{ value: AccountKind; label: string }> = [];
  if (!hasMain) options.push({ value: "MAIN", label: "Main" });
  if (!hasSavings) options.push({ value: "SAVINGS", label: "Savings" });
  options.push({ value: "CUSTOM", label: "Custom" });

  return (
    <div>
      <label htmlFor={`${idPrefix}-kind`} className="field-label">
        Kind
      </label>
      <select
        id={`${idPrefix}-kind`}
        name="kind"
        className="field-input"
        value={value}
        onChange={(e) => onChange(e.target.value as AccountKind)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AddAccountForm({
  hasMain,
  hasSavings,
  startingOpeningPrefill,
  startingOpeningCurrency,
  defaultCurrency,
  variant = "card",
  onSuccess,
}: {
  hasMain: boolean;
  hasSavings: boolean;
  startingOpeningPrefill: string;
  startingOpeningCurrency: Currency;
  defaultCurrency: Currency;
  variant?: "card" | "sheet";
  onSuccess?: () => void;
}) {
  const [kindChoice, setKindChoice] = useState<AccountKind | null>(null);
  const kind = resolvedKind(kindChoice, hasMain, hasSavings);
  const [state, formAction] = useActionState(createAccountAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const sheet = variant === "sheet";
  const idPrefix = sheet ? "sheet-account" : "account";

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const nameDefault =
    kind === "MAIN" ? "Main account" : kind === "SAVINGS" ? "Savings account" : "";
  const namePlaceholder = kind === "CUSTOM" ? "Prizes" : nameDefault;
  const openingRequired = kind === "MAIN";
  const openingPrefill = kind === "MAIN" ? startingOpeningPrefill : "";
  const currencyDefault = kind === "MAIN" ? startingOpeningCurrency : defaultCurrency;

  return (
    <form
      ref={formRef}
      action={formAction}
      className={sheet ? "space-y-4" : "card space-y-3"}
    >
      {sheet ? null : <h2 className="text-base font-semibold">Add account</h2>}
      <p className="text-sm text-ink-muted">
        Create a Main account for current money, a Savings account for this month’s leftover
        take, or a custom account (for example Prizes).
      </p>
      <div className={`grid grid-cols-2 gap-3 ${sheet ? "" : "sm:grid-cols-4"}`}>
        <div className={sheet ? "col-span-2" : ""}>
          <KindPicker
            value={kind}
            onChange={setKindChoice}
            hasMain={hasMain}
            hasSavings={hasSavings}
            idPrefix={idPrefix}
          />
          {state.errors?.kind && <p className="error-text">{state.errors.kind}</p>}
        </div>
        <div className={sheet ? "col-span-2" : ""}>
          <label htmlFor={`${idPrefix}-name`} className="field-label">
            Name{kind === "CUSTOM" ? "" : " (optional)"}
          </label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            key={`name-${kind}`}
            defaultValue={nameDefault}
            placeholder={namePlaceholder}
            className="field-input"
          />
          {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-opening`} className="field-label">
            Opening{openingRequired ? "" : " (optional)"}
          </label>
          <input
            id={`${idPrefix}-opening`}
            name="opening"
            key={`opening-${kind}-${openingPrefill}`}
            inputMode="decimal"
            defaultValue={openingPrefill}
            placeholder={openingRequired ? "0.00" : "0"}
            className="field-input"
          />
          {state.errors?.opening && <p className="error-text">{state.errors.opening}</p>}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-currency`} className="field-label">
            Currency
          </label>
          <select
            id={`${idPrefix}-currency`}
            name="currency"
            key={`currency-${kind}-${currencyDefault}`}
            className="field-input"
            defaultValue={currencyDefault}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <PendingSubmitButton
        idle="Add account"
        className={
          sheet
            ? "btn-primary w-full !rounded-xl !bg-neutral-900 py-3 text-base font-semibold dark:!bg-neutral-100 dark:!text-neutral-900"
            : "btn-primary min-w-[5.5rem]"
        }
        pendingLabel="Adding"
      />
    </form>
  );
}

export function MainOpeningForm({
  accountId,
  openingPrefill,
  currency,
}: {
  accountId: string;
  openingPrefill: string;
  currency: Currency;
}) {
  const [state, formAction] = useActionState(updateMainOpeningAction, initialActionState);
  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="id" value={accountId} />
      <p className="text-xs text-ink-muted">Opening is the Settings starting balance.</p>
      <div className="flex flex-wrap gap-2">
        <input
          name="opening"
          inputMode="decimal"
          defaultValue={openingPrefill}
          aria-label="Main opening"
          className="field-input min-w-[8rem] flex-1"
        />
        <select
          name="currency"
          defaultValue={currency}
          aria-label="Opening currency"
          className="field-input w-28"
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <PendingSubmitButton idle="Save" className="btn-secondary" pendingLabel="Saving" />
      </div>
      {state.errors?.opening && <p className="error-text">{state.errors.opening}</p>}
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      {state.ok ? <p className="text-xs text-brand-accent">Saved.</p> : null}
    </form>
  );
}

export function CustomEntryForm({
  accountId,
  defaultDate,
  defaultCurrency,
}: {
  accountId: string;
  defaultDate: string;
  defaultCurrency: Currency;
}) {
  const [state, formAction] = useActionState(createAccountEntryAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="accountId" value={accountId} />
      <p className="text-xs font-medium text-ink">Add or withdraw</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="field-label" htmlFor={`entry-dir-${accountId}`}>
            Direction
          </label>
          <select
            id={`entry-dir-${accountId}`}
            name="direction"
            className="field-input"
            defaultValue="add"
          >
            <option value="add">Add</option>
            <option value="withdraw">Withdraw</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor={`entry-amount-${accountId}`}>
            Amount
          </label>
          <input
            id={`entry-amount-${accountId}`}
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            className="field-input"
          />
          {state.errors?.amount && <p className="error-text">{state.errors.amount}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor={`entry-currency-${accountId}`}>
            Currency
          </label>
          <select
            id={`entry-currency-${accountId}`}
            name="currency"
            className="field-input"
            defaultValue={defaultCurrency}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor={`entry-date-${accountId}`}>
            Date
          </label>
          <input
            id={`entry-date-${accountId}`}
            name="date"
            type="date"
            defaultValue={defaultDate}
            className="field-input"
          />
          {state.errors?.date && <p className="error-text">{state.errors.date}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor={`entry-note-${accountId}`}>
            Note (optional)
          </label>
          <input id={`entry-note-${accountId}`} name="note" className="field-input" />
        </div>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <PendingSubmitButton idle="Record" className="btn-primary" pendingLabel="Recording" />
    </form>
  );
}

export function CustomRenameForm({ accountId, name }: { accountId: string; name: string }) {
  const [state, formAction] = useActionState(renameCustomAccountAction, initialActionState);
  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={accountId} />
      <div className="min-w-[8rem] flex-1">
        <label className="field-label" htmlFor={`rename-${accountId}`}>
          Rename
        </label>
        <input
          id={`rename-${accountId}`}
          name="name"
          defaultValue={name}
          className="field-input"
        />
      </div>
      <PendingSubmitButton idle="Rename" className="btn-secondary" pendingLabel="Saving" />
      {state.errors?.name && <p className="error-text w-full">{state.errors.name}</p>}
      {state.ok ? <p className="text-xs text-brand-accent">Saved.</p> : null}
    </form>
  );
}

export function CustomDeleteForm({ accountId, name }: { accountId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState(deleteCustomAccountAction, initialActionState);

  if (!confirming) {
    return (
      <button
        type="button"
        className="btn-danger mt-3 px-2 py-1 text-xs"
        onClick={() => setConfirming(true)}
      >
        Delete
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="id" value={accountId} />
      <p className="text-sm text-ink">
        Delete {name} and all of its entries? This cannot be undone.
      </p>
      <div className="flex flex-wrap gap-2">
        <PendingSubmitButton idle="Delete account" className="btn-danger" pendingLabel="Deleting" />
        <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
    </form>
  );
}
