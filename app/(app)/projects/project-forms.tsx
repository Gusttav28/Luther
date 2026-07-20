"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  toggleProjectCompletedAction,
  moveProjectAction,
  applyAllocationAction,
} from "./actions";
import { initialActionState } from "@/lib/action-state";
import { formatMinor, type Currency } from "@/lib/money";
import { periodLabel, type PeriodRef } from "@/lib/periods";
import { Money } from "@/components/money";

const CURRENCY_OPTIONS: Currency[] = ["CRC", "USD", "MXN"];

export function AddProjectForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="card space-y-3">
      <h2 className="text-base font-semibold">Add project</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="project-name" className="field-label">
            Name
          </label>
          <input id="project-name" name="name" className="field-input" placeholder="e.g. New laptop" />
          {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
        </div>
        <div>
          <label htmlFor="project-cost" className="field-label">
            Cost
          </label>
          <input
            id="project-cost"
            name="cost"
            inputMode="decimal"
            placeholder="0.00"
            className="field-input"
          />
          {state.errors?.cost && <p className="error-text">{state.errors.cost}</p>}
        </div>
        <div>
          <label htmlFor="project-currency" className="field-label">
            Currency
          </label>
          <select id="project-currency" name="currency" className="field-input" defaultValue="CRC">
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adding…" : "Add project"}
      </button>
    </form>
  );
}

export function ApplyAllocationButton({ periodText }: { periodText: string }) {
  const [state, formAction, pending] = useActionState(applyAllocationAction, initialActionState);
  return (
    <form action={formAction} className="space-y-1">
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Applying…" : `Apply allocation for ${periodText}`}
      </button>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      {state.ok && <p className="text-xs text-brand-600">Allocation applied.</p>}
    </form>
  );
}

interface ProjectCardData {
  id: string;
  name: string;
  costMinor: number;
  currency: Currency;
  priority: number;
  completed: boolean;
  savedMinor: number | null;
  fundedPercent: number | null;
  affordablePeriod: PeriodRef | null;
  affordableNow: boolean;
  projectionPossible: boolean;
}

function EditProjectForm({ project, onDone }: { project: ProjectCardData; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateProjectAction, initialActionState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);
  return (
    <form action={formAction} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <input type="hidden" name="id" value={project.id} />
      <div>
        <input name="name" defaultValue={project.name} aria-label="Name" className="field-input" />
        {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
      </div>
      <div>
        <input
          name="cost"
          inputMode="decimal"
          aria-label="Cost"
          defaultValue={(project.costMinor / 100).toFixed(2)}
          className="field-input"
        />
        {state.errors?.cost && <p className="error-text">{state.errors.cost}</p>}
      </div>
      <select name="currency" defaultValue={project.currency} aria-label="Currency" className="field-input">
        {CURRENCY_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
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

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const [editing, setEditing] = useState(false);

  let projectionText: string;
  if (project.completed) projectionText = "Completed";
  else if (project.affordableNow) projectionText = "Affordable now";
  else if (project.affordablePeriod) projectionText = `Affordable by ${periodLabel(project.affordablePeriod)}`;
  else if (!project.projectionPossible) projectionText = "No projection possible — set an allocation";
  else projectionText = "No projection possible";

  return (
    <li className={`card ${project.completed ? "opacity-60" : ""}`}>
      {editing ? (
        <EditProjectForm project={project} onDone={() => setEditing(false)} />
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">
                <span className="mr-2 text-xs font-bold text-stone-400">#{project.priority}</span>
                {project.name}
              </p>
              <p className="text-sm text-stone-500">
                Cost: {formatMinor(project.costMinor, project.currency)} · Saved:{" "}
                <Money minor={project.savedMinor} currency={project.currency} />
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                project.completed
                  ? "bg-stone-200 text-stone-600"
                  : project.affordableNow
                    ? "bg-brand-100 text-brand-700"
                    : "bg-stone-100 text-stone-600"
              }`}
            >
              {projectionText}
            </span>
          </div>

          <div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${project.fundedPercent ?? 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {project.fundedPercent === null ? "—" : `${project.fundedPercent}% funded`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form action={moveProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="direction" value="up" />
              <button type="submit" aria-label="Move up" className="btn-secondary px-2 py-1 text-xs">
                ↑
              </button>
            </form>
            <form action={moveProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="direction" value="down" />
              <button type="submit" aria-label="Move down" className="btn-secondary px-2 py-1 text-xs">
                ↓
              </button>
            </form>
            <button onClick={() => setEditing(true)} className="btn-secondary px-2 py-1 text-xs">
              Edit
            </button>
            <form action={toggleProjectCompletedAction}>
              <input type="hidden" name="id" value={project.id} />
              <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                {project.completed ? "Reopen" : "Mark completed"}
              </button>
            </form>
            <form action={deleteProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <button type="submit" className="btn-danger px-2 py-1 text-xs">
                Delete
              </button>
            </form>
          </div>
        </div>
      )}
    </li>
  );
}
