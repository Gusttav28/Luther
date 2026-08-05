"use client";

import { useEffect, useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { AddIncomeForm } from "@/app/(app)/income/income-forms";

export function AddIncomeSheet({
  year,
  month,
  open,
  onClose,
  defaultPeriod = "H1",
}: {
  year: number;
  month: number;
  open: boolean;
  onClose: () => void;
  defaultPeriod?: "H1" | "H2";
}) {
  const titleId = useId();
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setFormKey((k) => k + 1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (typeof document === "undefined" || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden" role="presentation">
      <button
        type="button"
        aria-label="Dismiss add income"
        className="absolute inset-0 bg-neutral-950/45"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-[28px] bg-surface-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" aria-hidden />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold text-ink">
            Add income
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <AddIncomeForm
          key={formKey}
          year={year}
          month={month}
          variant="sheet"
          defaultPeriod={defaultPeriod}
          onSuccess={onClose}
        />
      </div>
    </div>
  );
}

/** Mobile-only + FAB that opens the Add income sheet. */
export function IncomeAddFab({
  year,
  month,
  defaultPeriod = "H1",
}: {
  year: number;
  month: number;
  defaultPeriod?: "H1" | "H2";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Add income"
        title="Add income"
        onClick={() => setOpen(true)}
        className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-[0_8px_24px_rgba(38,103,73,0.4)] transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 md:hidden dark:bg-brand-600 dark:hover:bg-brand-500 dark:ring-offset-neutral-950"
      >
        <Plus className="h-7 w-7" strokeWidth={2.25} aria-hidden />
      </button>
      <AddIncomeSheet
        year={year}
        month={month}
        open={open}
        onClose={() => setOpen(false)}
        defaultPeriod={defaultPeriod}
      />
    </>
  );
}
