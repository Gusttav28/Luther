"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Money } from "@/components/money";
import { AddProjectSheet } from "@/components/add-project-sheet";
import { ProjectCard, type ProjectCardData } from "@/app/(app)/projects/project-forms";
import type { Currency } from "@/lib/money";

export function MobileProjects({
  currency,
  activeCount,
  totalCount,
  postLifetimeMinor,
  projects,
}: {
  currency: Currency;
  activeCount: number;
  totalCount: number;
  postLifetimeMinor: number | null;
  projects: ProjectCardData[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const progressRows = projects.filter((project) => project.fundedPercent !== null);

  return (
    <div className="space-y-[18px] md:hidden">
      <header>
        <h1 className="text-[26px] font-bold tracking-[-0.01em] text-ink">Projects</h1>
      </header>

      <section className="card !rounded-[20px] !px-5 !pb-4 !pt-5" aria-label="Projects summary">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
              Active projects
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">
              {activeCount}
              <span className="text-base font-semibold text-ink-muted"> of {totalCount}</span>
            </p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
              Left after savings
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">
              <Money minor={postLifetimeMinor} currency={currency} />
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-line pt-3 text-[12.5px] text-ink-muted">
          Priority project takes up to 70% of this
        </p>
      </section>

      <section className="card !rounded-[20px]" aria-label="Funding progress">
        <h2 className="section-title">Funding progress</h2>
        <p className="mt-1 mb-4 text-xs text-ink-muted">
          Saved percentage by project; currencies not combined
        </p>
        {progressRows.length === 0 ? (
          <p className="rounded-xl bg-surface-muted px-3 py-4 text-sm text-ink-faint">
            Funding progress is unavailable until project values can be compared.
          </p>
        ) : (
          <ul className="space-y-4">
            {progressRows.map((project) => {
              const pct = Math.min(100, Math.round(project.fundedPercent ?? 0));
              return (
                <li key={project.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium text-ink">
                      {project.name}
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-ink">{pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-brand-700 transition-all dark:bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">All projects</h2>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-brand-300"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            Add project
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="rounded-[20px] bg-surface-card px-4 py-5 text-sm text-ink-faint ring-1 ring-line">
            No projects yet — add your first purchase goal.
          </p>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} variant="mobile" />
            ))}
          </ul>
        )}
      </section>

      <AddProjectSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
