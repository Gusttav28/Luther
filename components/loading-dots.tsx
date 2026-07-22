"use client";

/** Animated three-dot pending indicator for buttons. */
export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-hidden="true">
      <span className="h-1 w-1 animate-pulse rounded-full bg-current opacity-90 [animation-delay:0ms]" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-current opacity-90 [animation-delay:150ms]" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-current opacity-90 [animation-delay:300ms]" />
    </span>
  );
}
