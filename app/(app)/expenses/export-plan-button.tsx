"use client";

import { useActionState, useEffect, useState } from "react";
import { copyExpensesMonthAction } from "./actions";
import { initialActionState } from "@/lib/action-state";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { monthName } from "@/lib/periods";

function previousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

/**
 * Copies the previous month’s expense rows into the month currently viewed
 * (same names, categories, amounts, days) so they show in the editable table.
 */
export function ExportPlanButton({ year, month }: { year: number; month: number }) {
  const source = previousMonth(year, month);
  const [state, formAction] = useActionState(copyExpensesMonthAction, initialActionState);
  const [popup, setPopup] = useState<{ kind: "ok" | "error"; message: string } | null>(null);

  useEffect(() => {
    setPopup(null);
  }, [year, month]);

  useEffect(() => {
    if (state.ok) {
      setPopup({
        kind: "ok",
        message: `Copied every expense from ${monthName(source.month)} ${source.year} into ${monthName(month)} ${year}. They are in the list below with Edit and Delete.`,
      });
      return;
    }
    if (state.errors?._form) {
      setPopup({ kind: "error", message: state.errors._form });
    }
    // Intentionally keyed on `state` so month changes alone do not re-open a prior result.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- year/month read from latest render when state updates
  }, [state]);

  return (
    <>
      <form action={formAction} className="flex flex-col items-start gap-1 sm:items-end">
        <input type="hidden" name="fromYear" value={source.year} />
        <input type="hidden" name="fromMonth" value={source.month} />
        <input type="hidden" name="toYear" value={year} />
        <input type="hidden" name="toMonth" value={month} />
        <PendingSubmitButton
          idle="Export plan"
          className="btn-secondary whitespace-nowrap px-3 py-2 text-xs"
          pendingLabel="Exporting"
        />
      </form>

      {popup ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setPopup(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="export-plan-dialog-title"
            className="card w-full max-w-sm space-y-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="export-plan-dialog-title" className="text-base font-semibold text-ink">
              {popup.kind === "ok" ? "Expenses exported" : "Could not export"}
            </h2>
            <p className="text-sm text-ink-secondary">{popup.message}</p>
            <div className="flex justify-end">
              <button type="button" className="btn-primary px-4 py-2" onClick={() => setPopup(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
