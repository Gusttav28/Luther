"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AddExpenseForm } from "@/app/(app)/expenses/expense-forms";
import type { CategoryOption } from "@/components/category-picker";

type FormConfig = {
  categories: CategoryOption[];
  defaultDate: string;
};

type AddExpenseSheetContextValue = {
  open: boolean;
  openAddExpense: () => void;
  closeAddExpense: () => void;
  registerForm: (config: FormConfig | null) => void;
};

const AddExpenseSheetContext = createContext<AddExpenseSheetContextValue | null>(null);

export function useAddExpenseSheet(): AddExpenseSheetContextValue {
  const ctx = useContext(AddExpenseSheetContext);
  if (!ctx) {
    throw new Error("useAddExpenseSheet must be used within AddExpenseSheetProvider");
  }
  return ctx;
}

/** Optional hook when provider may be absent (should not happen in app shell). */
export function useOptionalAddExpenseSheet(): AddExpenseSheetContextValue | null {
  return useContext(AddExpenseSheetContext);
}

export function AddExpenseSheetProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formKey, setFormKey] = useState(0);
  const titleId = useId();

  const closeAddExpense = useCallback(() => setOpen(false), []);

  const openAddExpense = useCallback(() => {
    if (!pathname.startsWith("/expenses")) {
      router.push("/expenses?add=1");
      return;
    }
    setFormKey((k) => k + 1);
    setOpen(true);
  }, [pathname, router]);

  const registerForm = useCallback((config: FormConfig | null) => {
    setFormConfig(config);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAddExpense();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAddExpense]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const value = useMemo(
    () => ({ open, openAddExpense, closeAddExpense, registerForm }),
    [open, openAddExpense, closeAddExpense, registerForm],
  );

  return (
    <AddExpenseSheetContext.Provider value={value}>
      {children}
      {open && formConfig ? (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            aria-label="Dismiss add expense"
            className="absolute inset-0 bg-neutral-950/45"
            onClick={closeAddExpense}
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
                Add expense
              </h2>
              <button
                type="button"
                onClick={closeAddExpense}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <AddExpenseForm
              key={formKey}
              categories={formConfig.categories}
              defaultDate={formConfig.defaultDate}
              variant="sheet"
              onSuccess={closeAddExpense}
            />
          </div>
        </div>
      ) : null}
    </AddExpenseSheetContext.Provider>
  );
}

/** Registers expense form config and honors ?add=1 deep link. */
export function RegisterAddExpenseForm({
  categories,
  defaultDate,
  openFromQuery,
}: {
  categories: CategoryOption[];
  defaultDate: string;
  openFromQuery?: boolean;
}) {
  const { registerForm, openAddExpense, closeAddExpense } = useAddExpenseSheet();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    registerForm({ categories, defaultDate });
    return () => registerForm(null);
  }, [categories, defaultDate, registerForm]);

  useEffect(() => {
    if (!openFromQuery) return;
    openAddExpense();
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("add");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [openFromQuery, openAddExpense, router, pathname]);

  useEffect(() => () => closeAddExpense(), [closeAddExpense]);

  return null;
}
