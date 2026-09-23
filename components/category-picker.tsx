"use client";

import { useMemo, useState, useTransition } from "react";
import {
  renameCategoryAction,
  setCategoryArchivedAction,
  deleteCategoryAction,
} from "@/app/(app)/plan/actions";
import { initialActionState } from "@/lib/action-state";
import { LoadingDots } from "@/components/loading-dots";
import { childrenOf, findCategory, rootsOf } from "@/lib/category-tree";

export interface CategoryOption {
  id: string;
  name: string;
  archived?: boolean;
  parentId?: string | null;
}

const NEW_SENTINEL = "__new__";
const NEW_CHILD_SENTINEL = "__new_child__";
const GENERAL_SENTINEL = "";

/**
 * Category field: pick a main category, then General or a subcategory.
 * Management uses server actions so it can sit inside Add/Edit expense forms.
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

  const nodes = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId ?? null,
        archived: c.archived,
      })),
    [categories]
  );
  const active = useMemo(() => nodes.filter((c) => !c.archived), [nodes]);
  const roots = useMemo(() => rootsOf(active), [active]);

  const named = defaultCategoryName
    ? nodes.find((c) => c.name.toLowerCase() === defaultCategoryName.trim().toLowerCase())
    : undefined;
  const initial = findCategory(nodes, defaultCategoryId) ?? named;
  const initialParentId = initial?.parentId ?? initial?.id ?? roots[0]?.id ?? "";
  const initialChildId = initial?.parentId ? initial.id : GENERAL_SENTINEL;

  const [mode, setMode] = useState<"existing" | "new">(
    !defaultCategoryId && roots.length === 0 ? "new" : "existing"
  );
  const [parentId, setParentId] = useState(initialParentId);
  const [childId, setChildId] = useState(initialChildId);
  const [newName, setNewName] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [editing, setEditing] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const parent = findCategory(nodes, parentId) ?? null;
  const selectedId =
    mode === "new"
      ? ""
      : childId === NEW_CHILD_SENTINEL
        ? ""
        : childId || parentId;
  const selected = findCategory(nodes, selectedId) ?? null;
  const childOptions = parent ? childrenOf(active, parent.id) : [];

  const categoryIdValue = selectedId;
  const categoryNameValue =
    mode === "new" ? newName.trim() : childId === NEW_CHILD_SENTINEL ? newChildName.trim() : selected?.name ?? "";
  const parentIdValue = mode === "new" ? "" : childId === NEW_CHILD_SENTINEL ? parentId : "";

  function handleParentChange(value: string) {
    setEditing(false);
    setActionError(null);
    if (value === NEW_SENTINEL) {
      setMode("new");
      setParentId("");
      setChildId(GENERAL_SENTINEL);
      return;
    }
    setMode("existing");
    setParentId(value);
    setChildId(GENERAL_SENTINEL);
    setNewChildName("");
  }

  function handleChildChange(value: string) {
    setEditing(false);
    setActionError(null);
    setChildId(value);
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
        setChildId(GENERAL_SENTINEL);
        if (selected.id === parentId) {
          setParentId(roots.find((r) => r.id !== selected.id)?.id ?? "");
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
      if (result.ok) setEditing(false);
    });
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`${idPrefix}-select`} className="field-label">
        Category
      </label>
      <input type="hidden" name="categoryId" value={categoryIdValue} />
      <input type="hidden" name="categoryName" value={categoryNameValue} />
      <input type="hidden" name="parentId" value={parentIdValue} />

      <div className="flex flex-wrap items-stretch gap-2">
        <select
          id={`${idPrefix}-select`}
          className="field-input min-w-0 flex-1"
          value={mode === "new" ? NEW_SENTINEL : parentId}
          onChange={(e) => handleParentChange(e.target.value)}
          aria-label="Category"
          disabled={editing || pending}
        >
          {roots.length === 0 && mode !== "new" ? (
            <option value="">No categories yet</option>
          ) : null}
          {roots.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NEW_SENTINEL}>New category…</option>
        </select>

        {mode === "existing" && parent && !editing ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={startEdit} disabled={pending} className="btn-secondary px-2.5 py-2 text-xs">
              Edit
            </button>
            {selected?.archived ? (
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
                disabled={pending || !selected}
                className="btn-secondary min-w-[4.5rem] px-2.5 py-2 text-xs"
              >
                {pendingAction === "archive" ? <LoadingDots /> : "Archive"}
              </button>
            )}
            <button
              type="button"
              onClick={runDelete}
              disabled={pending || !selected}
              className="btn-danger min-w-[3.5rem] px-2.5 py-2 text-xs"
            >
              {pendingAction === "delete" ? <LoadingDots /> : "Delete"}
            </button>
          </div>
        ) : null}
      </div>

      {mode === "existing" && parent ? (
        <div>
          <label htmlFor={`${idPrefix}-sub`} className="field-label">
            Subcategory
          </label>
          <select
            id={`${idPrefix}-sub`}
            className="field-input"
            value={childId}
            onChange={(e) => handleChildChange(e.target.value)}
            aria-label="Subcategory"
            disabled={editing || pending}
          >
            <option value={GENERAL_SENTINEL}>General ({parent.name})</option>
            {childOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW_CHILD_SENTINEL}>New subcategory…</option>
          </select>
        </div>
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
            placeholder="e.g. Subscriptions"
            className="field-input"
            autoComplete="off"
            disabled={pending}
          />
          <p className="mt-1 text-xs text-ink-muted">Created as a main category when you add the expense.</p>
        </div>
      ) : null}

      {childId === NEW_CHILD_SENTINEL && parent ? (
        <div>
          <label htmlFor={`${idPrefix}-new-child`} className="field-label">
            New subcategory under {parent.name}
          </label>
          <input
            id={`${idPrefix}-new-child`}
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            placeholder="e.g. AI"
            className="field-input"
            autoComplete="off"
            disabled={pending}
          />
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
          <button type="button" onClick={() => setEditing(false)} disabled={pending} className="btn-secondary px-2.5 py-2 text-xs">
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
