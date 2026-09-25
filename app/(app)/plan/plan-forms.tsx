"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createCategoryAction,
  renameCategoryAction,
  setCategoryArchivedAction,
  deleteCategoryAction,
  setCategoryParentAction,
  setPlanCellAction,
} from "./actions";
import { initialActionState } from "@/lib/action-state";
import { PendingSubmitButton } from "@/components/pending-submit-button";

export function AddCategoryForm({
  parents = [],
}: {
  parents?: Array<{ id: string; name: string }>;
} = {}) {
  const [state, formAction] = useActionState(createCategoryAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      {parents.length > 0 ? (
        <div className="w-full sm:w-44">
          <label htmlFor="new-category-parent" className="field-label">
            Under
          </label>
          <select id="new-category-parent" name="parentId" className="field-input" defaultValue="">
            <option value="">Main category</option>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <label htmlFor="new-category" className="field-label">
          New category
        </label>
        <input id="new-category" name="name" className="field-input" placeholder="e.g. Food or AI" />
        {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
        {state.errors?.parentId && <p className="error-text">{state.errors.parentId}</p>}
        {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      </div>
      <PendingSubmitButton idle="Add" className="btn-primary min-w-[4rem]" pendingLabel="Adding" />
    </form>
  );
}

/** Editable plan cell: submits on blur or Enter (R6). */
export function PlanCellInput({
  categoryId,
  year,
  month,
  valueMinor,
  inputClassName,
  ariaLabel,
}: {
  categoryId: string;
  year: number;
  month: number;
  valueMinor: number | null;
  /** Replaces the default size, padding, radius, and background classes. */
  inputClassName?: string;
  ariaLabel?: string;
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
        key={`${categoryId}-${year}-${month}-${valueMinor ?? 0}`}
        name="amount"
        inputMode="decimal"
        defaultValue={defaultValue}
        aria-label={ariaLabel ?? `Plan for month ${month}`}
        placeholder="0"
        className={`border text-right tabular-nums text-ink focus:border-brand-500 focus:outline-none ${
          inputClassName ?? "w-20 rounded bg-surface-card px-1.5 py-1 text-xs"
        } ${state.errors ? "border-red-400" : "border-line-strong"}`}
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

/** Moves a category under a main category, or back to main. Submits on change. */
function MoveCategoryForm({
  categoryId,
  parentId,
  parents,
}: {
  categoryId: string;
  parentId: string | null;
  parents: Array<{ id: string; name: string }>;
}) {
  const [state, formAction] = useActionState(setCategoryParentAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const options = parents.filter((parent) => parent.id !== categoryId);
  if (options.length === 0 && !parentId) return null;
  return (
    <form ref={formRef} action={formAction} className="inline-flex items-center gap-1">
      <input type="hidden" name="id" value={categoryId} />
      <label className="sr-only" htmlFor={`move-${categoryId}`}>
        Move under
      </label>
      <select
        id={`move-${categoryId}`}
        name="parentId"
        key={parentId ?? ""}
        defaultValue={parentId ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded border border-line-strong bg-surface-card px-1 py-0.5 text-xs text-ink"
      >
        <option value="">Main category</option>
        {options.map((parent) => (
          <option key={parent.id} value={parent.id}>
            Under {parent.name}
          </option>
        ))}
      </select>
      {state.errors?._form && (
        <span className="text-[10px] text-red-500">{state.errors._form}</span>
      )}
    </form>
  );
}

export function CategoryRowActions({
  categoryId,
  categoryName,
  archived,
  parentId = null,
  parents,
  hasChildren = false,
}: {
  categoryId: string;
  categoryName: string;
  archived: boolean;
  parentId?: string | null;
  /** Active main categories; when given (and the row has no children) shows "Move under". */
  parents?: Array<{ id: string; name: string }>;
  hasChildren?: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameErrors, setRenameErrors] = useState<Record<string, string> | undefined>();
  const [deleteState, deleteAction] = useActionState(deleteCategoryAction, initialActionState);

  async function handleRename(formData: FormData) {
    const result = await renameCategoryAction(initialActionState, formData);
    if (result.ok) {
      setRenaming(false);
      setRenameErrors(undefined);
    } else {
      setRenameErrors(result.errors);
    }
  }

  if (renaming) {
    return (
      <form action={handleRename} className="flex items-center gap-1">
        <input type="hidden" name="id" value={categoryId} />
        <input
          name="name"
          defaultValue={categoryName}
          aria-label="Category name"
          className="field-input w-24 py-1 text-xs"
        />
        <PendingSubmitButton
          idle="Save"
          className="text-action min-w-[2.5rem] text-xs font-medium text-brand-950 dark:text-brand-300"
          pendingLabel="Saving"
        />
        <button type="button" onClick={() => setRenaming(false)} className="text-action text-xs">
          ✕
        </button>
        {renameErrors?.name && <p className="error-text">{renameErrors.name}</p>}
        {renameErrors?._form && <p className="error-text">{renameErrors._form}</p>}
      </form>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2 text-xs">
      {parents && !hasChildren && !archived ? (
        <MoveCategoryForm categoryId={categoryId} parentId={parentId} parents={parents} />
      ) : null}
      <button onClick={() => setRenaming(true)} className="text-action">
        Rename
      </button>
      <form action={setCategoryArchivedAction} className="inline">
        <input type="hidden" name="id" value={categoryId} />
        <input type="hidden" name="archived" value={archived ? "false" : "true"} />
        <PendingSubmitButton
          idle={archived ? "Unarchive" : "Archive"}
          className="text-action min-w-[3.5rem]"
          pendingLabel="Updating"
        />
      </form>
      {!archived && (
        <form action={deleteAction} className="inline">
          <input type="hidden" name="id" value={categoryId} />
          <PendingSubmitButton
            idle="Delete"
            className="text-action-danger min-w-[3rem]"
            pendingLabel="Deleting"
          />
        </form>
      )}
      {deleteState.errors?._form && (
        <span className="text-[10px] text-red-500">{deleteState.errors._form}</span>
      )}
    </span>
  );
}
