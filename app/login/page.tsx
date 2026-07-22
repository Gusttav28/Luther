"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, type LoginState } from "./actions";
import { LutherLogo } from "@/components/logo";

const initialState: LoginState = {};

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (!state.ok) return;
    try {
      router.prefetch("/");
    } catch {
      // ignore
    }
    router.replace("/");
  }, [state.ok, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LutherLogo size="lg" href={null} priority />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950 dark:text-brand-300">
            Luther
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Personal finance, under your control.</p>
        </div>
        <form action={formAction} className="card space-y-4" aria-busy={pending}>
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
              className="field-input"
            />
          </div>
          {state.error ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          ) : null}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
