"use client";

import { useFormStatus } from "react-dom";
import { LoadingDots } from "@/components/loading-dots";

/**
 * Submit button that shows animated dots while the parent form’s server action runs.
 * Must be rendered inside a <form>.
 */
export function PendingSubmitButton({
  idle,
  className = "",
  pendingLabel = "Loading",
}: {
  idle: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? (
        <span className="inline-flex min-w-[2.5rem] items-center justify-center">
          <LoadingDots />
          <span className="sr-only">{pendingLabel}</span>
        </span>
      ) : (
        idle
      )}
    </button>
  );
}
