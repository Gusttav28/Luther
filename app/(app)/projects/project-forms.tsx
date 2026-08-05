"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  toggleProjectCompletedAction,
  moveProjectAction,
  setPriorityProjectAction,
} from "./actions";
import { initialActionState } from "@/lib/action-state";
import { formatMinor, type Currency } from "@/lib/money";
import { periodLabel, type PeriodRef } from "@/lib/periods";
import { Money } from "@/components/money";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import type { PeriodMode } from "@/lib/waterfall";

const CURRENCY_OPTIONS: Currency[] = ["CRC", "USD"];

function goalDateInputValue(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function periodModeLabel(mode: PeriodMode): string {
  if (mode === "H1") return "First half";
  if (mode === "H2") return "Second half";
  return "Both halves";
}

function goalDateDisplay(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AddProjectForm({
  variant = "card",
  onSuccess,
}: {
  variant?: "card" | "sheet";
  onSuccess?: () => void;
} = {}) {
  const [state, formAction] = useActionState(createProjectAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const sheet = variant === "sheet";
  const idPrefix = sheet ? "sheet-project" : "project";

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className={sheet ? "space-y-4" : "card space-y-3"}>
      {sheet ? null : (
        <>
          <h2 className="text-base font-semibold">Add project</h2>
          <p className="text-xs text-ink-muted">
            Allocation % is taken from the budget left after lifetime savings (70%). Maximum 70%.
          </p>
        </>
      )}
      <div className={`grid grid-cols-2 gap-3 ${sheet ? "" : "sm:grid-cols-3"}`}>
        <div className={sheet ? "col-span-2" : "col-span-2 sm:col-span-1"}>
          <label htmlFor={`${idPrefix}-name`} className="field-label">
            Name
          </label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            className="field-input"
            placeholder="e.g. New laptop"
          />
          {state.errors?.name && <p className="error-text">{state.errors.name}</p>}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-cost`} className="field-label">
            Cost
          </label>
          <input
            id={`${idPrefix}-cost`}
            name="cost"
            inputMode="decimal"
            placeholder="0.00"
            className="field-input"
          />
          {state.errors?.cost && <p className="error-text">{state.errors.cost}</p>}
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
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-percent`} className="field-label">
            Allocation %
          </label>
          <input
            id={`${idPrefix}-percent`}
            name="allocationPercent"
            type="number"
            min={1}
            max={70}
            defaultValue={50}
            className="field-input"
          />
          {state.errors?.allocationPercent && (
            <p className="error-text">{state.errors.allocationPercent}</p>
          )}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-period`} className="field-label">
            Period
          </label>
          <select
            id={`${idPrefix}-period`}
            name="periodMode"
            className="field-input"
            defaultValue="BOTH"
          >
            <option value="H1">First half (H1)</option>
            <option value="H2">Second half (H2)</option>
            <option value="BOTH">Both halves</option>
          </select>
          {state.errors?.periodMode && <p className="error-text">{state.errors.periodMode}</p>}
        </div>
        <div className={sheet ? "col-span-2" : ""}>
          <label htmlFor={`${idPrefix}-goal`} className="field-label">
            Goal date
          </label>
          <input id={`${idPrefix}-goal`} name="goalDate" type="date" className="field-input" />
          {state.errors?.goalDate && <p className="error-text">{state.errors.goalDate}</p>}
        </div>
        <div className={sheet ? "col-span-2" : "col-span-2 sm:col-span-3"}>
          <label htmlFor={`${idPrefix}-link`} className="field-label">
            Link (optional)
          </label>
          <input
            id={`${idPrefix}-link`}
            name="link"
            type="text"
            inputMode="url"
            placeholder="https://…"
            className="field-input"
          />
          {state.errors?.link && <p className="error-text">{state.errors.link}</p>}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-secondary">
        <input type="checkbox" name="isPriority" className="rounded border-line" />
        Mark as priority project (only one active)
      </label>
      {state.errors?._form && <p className="error-text">{state.errors._form}</p>}
      <PendingSubmitButton
        idle="Add project"
        className={
          sheet
            ? "btn-primary w-full !rounded-xl !bg-neutral-900 py-3 text-base font-semibold dark:!bg-neutral-100 dark:!text-neutral-900"
            : "btn-primary min-w-[7.5rem]"
        }
        pendingLabel="Adding"
      />
    </form>
  );
}

export interface ProjectCardData {
  id: string;
  name: string;
  costMinor: number;
  currency: Currency;
  priority: number;
  allocationPercent: number;
  periodMode: PeriodMode;
  goalDate: Date | null;
  link: string | null;
  isPriority: boolean;
  completed: boolean;
  savedMinor: number | null;
  fundedPercent: number | null;
  affordablePeriod: PeriodRef | null;
  affordableNow: boolean;
  projectionPossible: boolean;
  expectedTakeMinor: number | null;
  reportingCurrency: Currency;
}

function EditProjectForm({ project, onDone }: { project: ProjectCardData; onDone: () => void }) {
  const [state, formAction] = useActionState(updateProjectAction, initialActionState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={project.id} />
      <div className="grid grid-cols-2 gap-2">
        <input name="name" defaultValue={project.name} aria-label="Name" className="field-input" />
        <input
          name="cost"
          inputMode="decimal"
          aria-label="Cost"
          defaultValue={(project.costMinor / 100).toFixed(2)}
          className="field-input"
        />
        <select name="currency" defaultValue={project.currency} aria-label="Currency" className="field-input">
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          name="allocationPercent"
          type="number"
          min={1}
          max={70}
          defaultValue={project.allocationPercent}
          aria-label="Allocation percent"
          className="field-input"
        />
        <select name="periodMode" defaultValue={project.periodMode} aria-label="Period" className="field-input">
          <option value="H1">H1</option>
          <option value="H2">H2</option>
          <option value="BOTH">Both</option>
        </select>
        <input
          name="goalDate"
          type="date"
          defaultValue={goalDateInputValue(project.goalDate)}
          aria-label="Goal date"
          className="field-input"
        />
        <div className="col-span-2">
          <label className="field-label" htmlFor={`edit-link-${project.id}`}>
            Link (optional)
          </label>
          <input
            id={`edit-link-${project.id}`}
            name="link"
            type="text"
            inputMode="url"
            defaultValue={project.link ?? ""}
            aria-label="Link"
            placeholder="https://…"
            className="field-input"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPriority" defaultChecked={project.isPriority} className="rounded border-line" />
        Priority project
      </label>
      <div className="flex items-center gap-2">
        <PendingSubmitButton idle="Save" className="btn-primary min-w-[4.5rem] px-3 py-1.5" pendingLabel="Saving" />
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
      </div>
      {state.errors &&
        Object.entries(state.errors).map(([k, v]) => (
          <p key={k} className="error-text">
            {v}
          </p>
        ))}
    </form>
  );
}

export function ProjectCard({
  project,
  variant = "default",
}: {
  project: ProjectCardData;
  variant?: "default" | "mobile";
}) {
  const [editing, setEditing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const mobile = variant === "mobile";

  let projectionText: string;
  if (project.completed) projectionText = "Completed";
  else if (project.affordableNow) projectionText = "Affordable now";
  else if (project.affordablePeriod) projectionText = `Affordable by ${periodLabel(project.affordablePeriod)}`;
  else if (!project.isPriority) projectionText = "Not priority — funding paused";
  else if (!project.projectionPossible) projectionText = "No projection — need leftover budget";
  else projectionText = "No projection possible";

  const fundedLabel =
    project.fundedPercent === null ? "—" : `${Math.min(100, Math.round(project.fundedPercent))}%`;
  const barWidth = `${Math.min(100, project.fundedPercent ?? 0)}%`;

  if (mobile) {
    return (
      <li
        className={`card !rounded-[20px] ${project.completed ? "opacity-60" : ""} ${
          project.isPriority ? "ring-1 ring-brand-700" : ""
        }`}
      >
        {editing ? (
          <EditProjectForm project={project} onDone={() => setEditing(false)} />
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex flex-wrap items-center gap-2">
                {project.isPriority ? (
                  <span className="rounded-md bg-brand-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Priority
                  </span>
                ) : null}
                <p className="truncate text-base font-semibold text-ink">{project.name}</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
                {projectionText}
              </span>
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <p className="text-[13px] text-ink-muted">
                  <Money minor={project.savedMinor} currency={project.currency} /> of{" "}
                  {formatMinor(project.costMinor, project.currency)}
                </p>
                <p className="text-sm font-bold tabular-nums text-ink">{fundedLabel}</p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand-700 transition-all dark:bg-brand-500"
                  style={{ width: barWidth }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                aria-expanded={detailsOpen}
                onClick={() => setDetailsOpen((open) => !open)}
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                {detailsOpen ? "Hide details" : "Details"}
                {detailsOpen ? (
                  <ChevronUp className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                )}
              </button>
              <div className="flex items-center gap-1.5">
                <form action={moveProjectAction}>
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="direction" value="up" />
                  <PendingSubmitButton
                    idle={
                      <>
                        <ChevronUp className="h-4 w-4" strokeWidth={2} aria-hidden />
                        <span className="sr-only">Move up</span>
                      </>
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-ink-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    pendingLabel="Moving up"
                  />
                </form>
                <form action={moveProjectAction}>
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="direction" value="down" />
                  <PendingSubmitButton
                    idle={
                      <>
                        <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
                        <span className="sr-only">Move down</span>
                      </>
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-ink-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    pendingLabel="Moving down"
                  />
                </form>
              </div>
            </div>

            {detailsOpen ? (
              <div className="space-y-3 border-t border-line pt-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
                      Currency
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">{project.currency}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
                      Allocation
                    </dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-ink">
                      {project.allocationPercent}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
                      Period
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {periodModeLabel(project.periodMode)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
                      Goal date
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {goalDateDisplay(project.goalDate)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
                      Expected this month
                    </dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-ink">
                      <Money
                        minor={project.expectedTakeMinor}
                        currency={project.reportingCurrency}
                      />
                    </dd>
                  </div>
                  {project.link ? (
                    <div className="col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
                        Link
                      </dt>
                      <dd className="mt-0.5 truncate">
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-brand-800 underline-offset-2 hover:underline dark:text-brand-300"
                        >
                          Open link
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="flex flex-wrap gap-2">
                  {!project.completed && !project.isPriority ? (
                    <form action={setPriorityProjectAction}>
                      <input type="hidden" name="id" value={project.id} />
                      <PendingSubmitButton
                        idle="Set priority"
                        className="btn-primary min-w-[5.5rem] px-3 py-2 text-xs"
                        pendingLabel="Updating"
                      />
                    </form>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="btn-secondary px-3 py-2 text-xs"
                  >
                    Edit
                  </button>
                  <form action={toggleProjectCompletedAction}>
                    <input type="hidden" name="id" value={project.id} />
                    <PendingSubmitButton
                      idle={project.completed ? "Reopen" : "Mark completed"}
                      className="btn-secondary min-w-[6rem] px-3 py-2 text-xs"
                      pendingLabel="Updating"
                    />
                  </form>
                  <form action={deleteProjectAction}>
                    <input type="hidden" name="id" value={project.id} />
                    <PendingSubmitButton
                      idle="Delete"
                      className="btn-danger min-w-[3.5rem] px-3 py-2 text-xs"
                      pendingLabel="Deleting"
                    />
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </li>
    );
  }

  return (
    <li
      className={`card ${project.completed ? "opacity-60" : ""} ${
        project.isPriority ? "ring-1 ring-brand-600" : ""
      }`}
    >
      {editing ? (
        <EditProjectForm project={project} onDone={() => setEditing(false)} />
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">
                {project.isPriority && (
                  <span className="mr-2 rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    Priority
                  </span>
                )}
                {project.name}
              </p>
              <p className="text-sm text-ink-muted">
                Cost: {formatMinor(project.costMinor, project.currency)} · {project.allocationPercent}% ·{" "}
                {project.periodMode}
                {project.goalDate ? ` · Goal ${goalDateInputValue(project.goalDate)}` : ""}
              </p>
              <p className="text-sm text-ink-muted">
                Saved: <Money minor={project.savedMinor} currency={project.currency} />
                {project.expectedTakeMinor !== null && (
                  <>
                    {" "}
                    · Expected this month:{" "}
                    <Money minor={project.expectedTakeMinor} currency={project.reportingCurrency} />
                  </>
                )}
              </p>
              {project.link ? (
                <p className="truncate text-sm">
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-800 underline-offset-2 hover:underline dark:text-brand-300"
                  >
                    Open link
                  </a>
                </p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-muted">
              {projectionText}
            </span>
          </div>

          <div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand-700 transition-all dark:bg-brand-500"
                style={{ width: barWidth }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {project.fundedPercent === null ? "—" : `${project.fundedPercent}% funded`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!project.completed && !project.isPriority && (
              <form action={setPriorityProjectAction}>
                <input type="hidden" name="id" value={project.id} />
                <PendingSubmitButton
                  idle="Set priority"
                  className="btn-primary min-w-[5.5rem] px-2 py-1 text-xs"
                  pendingLabel="Updating"
                />
              </form>
            )}
            <form action={moveProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="direction" value="up" />
              <PendingSubmitButton
                idle="↑"
                className="btn-secondary min-w-[2rem] px-2 py-1 text-xs"
                pendingLabel="Moving up"
              />
            </form>
            <form action={moveProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="direction" value="down" />
              <PendingSubmitButton
                idle="↓"
                className="btn-secondary min-w-[2rem] px-2 py-1 text-xs"
                pendingLabel="Moving down"
              />
            </form>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-secondary px-2 py-1 text-xs"
            >
              Edit
            </button>
            <form action={toggleProjectCompletedAction}>
              <input type="hidden" name="id" value={project.id} />
              <PendingSubmitButton
                idle={project.completed ? "Reopen" : "Mark completed"}
                className="btn-secondary min-w-[6rem] px-2 py-1 text-xs"
                pendingLabel="Updating"
              />
            </form>
            <form action={deleteProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <PendingSubmitButton
                idle="Delete"
                className="btn-danger min-w-[3.5rem] px-2 py-1 text-xs"
                pendingLabel="Deleting"
              />
            </form>
          </div>
        </div>
      )}
    </li>
  );
}
