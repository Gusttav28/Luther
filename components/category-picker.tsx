"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  renameCategoryAction,
  setCategoryArchivedAction,
  deleteCategoryAction,
} from "@/app/(app)/plan/actions";
import { initialActionState } from "@/lib/action-state";
import { LoadingDots } from "@/components/loading-dots";

export interface CategoryOption {
  id: string;
  name: string;
  archived?: boolean;
}

const NEW_SENTINEL = "__new__";

/**
 * Category field: pick / create a category, and manage the selected one (rename, archive/restore, delete).
 * Management uses server actions (not nested forms) so it can sit inside Add/Edit expense forms.
 */
export function CategoryPicker({
  categories,
  defaultCategoryId,
  defaultCategoryName,
  errors,
  idPrefix = "category",
}: {
  categories: CategoryOption[];
  defaultCategoryId?: string;
  defaultCategoryName?: string;
  errors?: { categoryId?: string; categoryName?: string };
  idPrefix?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"archive" | "restore" | "delete" | "rename" | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const active = useMemo(() => categories.filter((c) => !c.archived), [categories]);
  const archived = useMemo(() => categories.filter((c) => c.archived), [categories]);

  const initialIsNew =
    Boolean(defaultCategoryName) &&
    !categories.some((c) => c.id === defaultCategoryId) &&
    !categories.some((c) => c.name.toLowerCase() === defaultCategoryName?.trim().toLowerCase());

  const [mode, setMode] = useState<"existing" | "new">(
    initialIsNew || (!defaultCategoryId && active.length === 0 && archived.length === 0)
      ? "new"
      : "existing"
  );
  const [selectedId, setSelectedId] = useState(() => {
    if (defaultCategoryId && categories.some((c) => c.id === defaultCategoryId)) {
      return defaultCategoryId;
    }
    const byName = categories.find(
      (c) => c.name.toLowerCase() === defaultCategoryName?.trim().toLowerCase()
    );
    return byName?.id ?? active[0]?.id ?? archived[0]?.id ?? "";
  });
  const [newName, setNewName] = useState(initialIsNew ? (defaultCategoryName ?? "") : "");
  const [editing, setEditing] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const selected = categories.find((c) => c.id === selectedId) ?? null;
  const categoryIdValue = mode === "existing" ? selectedId : "";
  const categoryNameValue = mode === "existing" ? (selected?.name ?? "") : newName.trim();

  useEffect(() => {
    if (mode !== "existing") return;
    if (selectedId && categories.some((c) => c.id === selectedId)) return;
    const fallback = active[0]?.id ?? archived[0]?.id ?? "";
    if (!fallback) {
      setMode("new");
      setSelectedId("");
      return;
    }
    setSelectedId(fallback);
  }, [categories, mode, selectedId, active, archived]);

  function handleSelectChange(value: string) {
    setEditing(false);
    setActionError(null);
    if (value === NEW_SENTINEL) {
      setMode("new");
      setSelectedId("");
      return;
    }
    setMode("existing");
    setSelectedId(value);
  }

  function startEdit() {
    if (!selected) return;
    setRenameValue(selected.name);
    setEditing(true);
    setActionError(null);
  }

  function runSetArchived(archivedValue: boolean) {
    if (!selected) return;
    setActionError(null);
    setPendingAction(archivedValue ? "archive" : "restore");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", selected.id);
      fd.set("archived", archivedValue ? "true" : "false");
      await setCategoryArchivedAction(fd);
      setPendingAction(null);
    });
  }

  function runDelete() {
    if (!selected) return;
    setActionError(null);
    setPendingAction("delete");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", selected.id);
      const result = await deleteCategoryAction(initialActionState, fd);
      setPendingAction(null);
      if (result.errors?._form) {
        setActionError(result.errors._form);
        return;
      }
      if (result.ok) {
        const remaining = categories.filter((c) => c.id !== selected.id);
        const nextActive = remaining.filter((c) => !c.archived);
        const nextArchived = remaining.filter((c) => c.archived);
        if (remaining.length === 0) {
          setMode("new");
          setSelectedId("");
        } else {
          setSelectedId(nextActive[0]?.id ?? nextArchived[0]?.id ?? "");
        }
      }
    });
  }

  function runRename() {
    if (!selected) return;
    setActionError(null);
    setPendingAction("rename");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", selected.id);
      fd.set("name", renameValue);
      const result = await renameCategoryAction(initialActionState, fd);
      setPendingAction(null);
      if (result.errors?.name || result.errors?._form) {
        setActionError(result.errors.name ?? result.errors._form ?? "Could not rename");
        return;
      }
      if (result.ok) {
        setEditing(false);
      }
    });
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`${idPrefix}-select`} className="field-label">
        Category
      </label>
      <input type="hidden" name="categoryId" value={categoryIdValue} />
      <input type="hidden" name="categoryName" value={categoryNameValue} />

      <div className="flex flex-wrap items-stretch gap-2">
        <select
          id={`${idPrefix}-select`}
          className="field-input min-w-0 flex-1"
          value={mode === "new" ? NEW_SENTINEL : selectedId}
          onChange={(e) => handleSelectChange(e.target.value)}
          aria-label="Category"
          disabled={editing || pending}
        >
          {categories.length === 0 && mode !== "new" ? (
            <option value="">No categories yet</option>
          ) : null}
          {active.length > 0 ? (
            <optgroup label="Active">
              {active.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {archived.length > 0 ? (
            <optgroup label="Archived">
              {archived.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (archived)
                </option>
              ))}
            </optgroup>
          ) : null}
          <option value={NEW_SENTINEL}>New category…</option>
        </select>

        {mode === "existing" && selected && !editing ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={startEdit}
              disabled={pending}
              className="btn-secondary px-2.5 py-2 text-xs"
            >
              Edit
            </button>
            {selected.archived ? (
              <button
                type="button"
                onClick={() => runSetArchived(false)}
                disabled={pending}
                className="btn-secondary min-w-[4.5rem] px-2.5 py-2 text-xs"
              >
                {pendingAction === "restore" ? <LoadingDots /> : "Restore"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => runSetArchived(true)}
                disabled={pending}
                className="btn-secondary min-w-[4.5rem] px-2.5 py-2 text-xs"
              >
                {pendingAction === "archive" ? <LoadingDots /> : "Archive"}
              </button>
            )}
            <button
              type="button"
              onClick={runDelete}
              disabled={pending}
              className="btn-danger min-w-[3.5rem] px-2.5 py-2 text-xs"
            >
              {pendingAction === "delete" ? <LoadingDots /> : "Delete"}
            </button>
          </div>
        ) : null}
      </div>

      {mode === "existing" && selected?.archived ? (
        <p className="text-xs text-ink-muted">
          This category is archived. Restore it to use it for new expenses, or pick an active one.
        </p>
      ) : null}

      {mode === "new" ? (
        <div>
          <label htmlFor={`${idPrefix}-new-name`} className="field-label">
            New category name
          </label>
          <input
            id={`${idPrefix}-new-name`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Groceries"
            className="field-input"
            autoComplete="off"
            disabled={pending}
          />
          <p className="mt-1 text-xs text-ink-muted">Created when you add the expense.</p>
        </div>
      ) : null}

      {editing && selected ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            aria-label="Rename category"
            className="field-input min-w-0 flex-1"
            autoComplete="off"
            disabled={pending}
          />
          <button
            type="button"
            onClick={runRename}
            disabled={pending || !renameValue.trim()}
            className="btn-primary min-w-[3.5rem] px-3 py-2 text-xs"
          >
            {pendingAction === "rename" ? <LoadingDots /> : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={pending}
            className="btn-secondary px-2.5 py-2 text-xs"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {actionError ? <p className="error-text">{actionError}</p> : null}
      {errors?.categoryName && <p className="error-text">{errors.categoryName}</p>}
      {errors?.categoryId && <p className="error-text">{errors.categoryId}</p>}
    </div>
  );
}
