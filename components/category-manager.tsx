"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createCategoryAction,
  renameCategoryAction,
  setCategoryArchivedAction,
  deleteCategoryAction,
} from "@/app/(app)/plan/actions";
import { initialActionState } from "@/lib/action-state";
import { PendingSubmitButton } from "@/components/pending-submit-button";

export interface CategoryRow {
  id: string;
  name: string;
  archived: boolean;
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-semibold">Categories</h2>
        <p className="text-sm text-ink-muted">
          Create, rename, or delete categories. Type a new name when adding an expense to create
          one on the fly.
        </p>
      </div>
      <AddCategoryInline />
      {active.length === 0 ? (
        <p className="text-sm text-ink-faint">No categories yet — add one above or when saving an expense.</p>
      ) : (
        <ul className="[&>li+li]:border-t [&>li+li]:border-line">
          {active.map((c) => (
            <CategoryManagerRow key={c.id} category={c} />
          ))}
        </ul>
      )}
      {archived.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">Archived</p>
          <ul className="[&>li+li]:border-t [&>li+li]:border-line">
            {archived.map((c) => (
              <CategoryManagerRow key={c.id} category={c} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function AddCategoryInline() {
  const [state, formAction] = useActionState(createCategoryAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <div className="flex-1">
        <label htmlFor="new-category-inline" className="field-label">
          New category
        </label>
        <input id="new-category-inline" name="name" className="field-input" placeholder="e.g. Food" />
        {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
        {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      </div>
      <PendingSubmitButton idle="Add" className="btn-primary min-w-[4rem]" pendingLabel="Adding" />
    </form>
  );
}

function CategoryManagerRow({ category }: { category: CategoryRow }) {
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
      <li className="flex items-center gap-2 py-2">
        <form action={handleRename} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="id" value={category.id} />
          <input
            name="name"
            defaultValue={category.name}
            aria-label="Category name"
            className="field-input flex-1 py-1.5 text-sm"
          />
          <PendingSubmitButton
            idle="Save"
            className="btn-primary min-w-[3.5rem] px-3 py-1.5 text-xs"
            pendingLabel="Saving"
          />
          <button type="button" onClick={() => setRenaming(false)} className="btn-secondary px-2 py-1.5 text-xs">
            Cancel
          </button>
        </form>
        {renameErrors?.name && <p className="error-text">{renameErrors.name}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className={`text-sm font-medium ${category.archived ? "text-ink-faint line-through" : "text-ink"}`}>
        {category.name}
      </span>
      <span className="flex items-center gap-2 text-xs">
        <button type="button" onClick={() => setRenaming(true)} className="text-action">
          Edit
        </button>
        <form action={setCategoryArchivedAction} className="inline">
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="archived" value={category.archived ? "false" : "true"} />
          <PendingSubmitButton
            idle={category.archived ? "Restore" : "Archive"}
            className="text-action min-w-[3.5rem]"
            pendingLabel="Updating"
          />
        </form>
        {!category.archived && (
          <form action={deleteAction} className="inline">
            <input type="hidden" name="id" value={category.id} />
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
    </li>
  );
}
