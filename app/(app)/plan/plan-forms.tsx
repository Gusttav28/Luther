"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createCategoryAction,
  renameCategoryAction,
  setCategoryArchivedAction,
  deleteCategoryAction,
  setPlanCellAction,
} from "./actions";
import { initialActionState } from "@/lib/action-state";

export function AddCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <div className="flex-1">
        <label htmlFor="new-category" className="field-label">
          New category
        </label>
        <input id="new-category" name="name" className="field-input" placeholder="e.g. Food" />
        {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
        {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        Add
      </button>
    </form>
  );
}

/** Editable plan cell: submits on blur or Enter (R6). */
export function PlanCellInput({
  categoryId,
  year,
  month,
  valueMinor,
}: {
  categoryId: string;
  year: number;
  month: number;
  valueMinor: number | null;
}) {
  const [state, formAction] = useActionState(setPlanCellAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValue =
    valueMinor === null || valueMinor === 0 ? "" : (valueMinor / 100).toFixed(2);
  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <input
        name="amount"
        inputMode="decimal"
        defaultValue={defaultValue}
        aria-label={`Plan for month ${month}`}
        className={`w-20 rounded border px-1.5 py-1 text-right text-xs tabular-nums focus:border-brand-500 focus:outline-none ${
          state.errors ? "border-red-400" : "border-stone-200"
        }`}
        onBlur={(e) => {
          if (e.target.value !== defaultValue) formRef.current?.requestSubmit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
      />
    </form>
  );
}

export function CategoryRowActions({
  categoryId,
  categoryName,
  archived,
}: {
  categoryId: string;
  categoryName: string;
  archived: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameState, renameAction, renamePending] = useActionState(
    renameCategoryAction,
    initialActionState
  );
  const [deleteState, deleteAction] = useActionState(deleteCategoryAction, initialActionState);
  useEffect(() => {
    if (renameState.ok) setRenaming(false);
  }, [renameState.ok]);

  if (renaming) {
    return (
      <form action={renameAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={categoryId} />
        <input
          name="name"
          defaultValue={categoryName}
          aria-label="Category name"
          className="w-24 rounded border border-stone-300 px-1.5 py-1 text-xs"
        />
        <button type="submit" disabled={renamePending} className="text-xs font-medium text-brand-600">
          Save
        </button>
        <button type="button" onClick={() => setRenaming(false)} className="text-xs text-stone-400">
          ✕
        </button>
        {renameState.errors?.name && <p className="error-text">{renameState.errors.name}</p>}
      </form>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <button onClick={() => setRenaming(true)} className="text-stone-400 hover:text-stone-600">
        Rename
      </button>
      <form action={setCategoryArchivedAction} className="inline">
        <input type="hidden" name="id" value={categoryId} />
        <input type="hidden" name="archived" value={archived ? "false" : "true"} />
        <button type="submit" className="text-stone-400 hover:text-stone-600">
          {archived ? "Unarchive" : "Archive"}
        </button>
      </form>
      {!archived && (
        <form action={deleteAction} className="inline">
          <input type="hidden" name="id" value={categoryId} />
          <button type="submit" className="text-red-400 hover:text-red-600">
            Delete
          </button>
        </form>
      )}
      {deleteState.errors?._form && (
        <span className="text-[10px] text-red-500">{deleteState.errors._form}</span>
      )}
    </span>
  );
}
