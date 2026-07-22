"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "luther-theme";
type Theme = "light" | "dark";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    () => "light"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be disabled; the in-memory theme still applies.
    }
    listeners.forEach((listener) => listener());
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={`flex items-center rounded-xl py-2 text-xs font-medium text-ink-muted transition hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:ring-offset-neutral-950 ${compact ? "h-11 w-11 justify-center px-0" : "gap-2 px-3"}`}
    >
      {theme === "dark" ? (
        <Sun aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Moon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      )}
      <span className={compact ? "sr-only" : undefined}>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
