import Link from "next/link";
import type { ProjectView } from "@/lib/queries/projects";

export function ProjectsProgress({ projects }: { projects: ProjectView[] }) {
  const active = projects.filter((p) => !p.completedAt);

  return (
    <section className="card h-full">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="section-title">Projects funded</h2>
          <p className="mt-0.5 text-xs text-stone-500">Active purchase goals</p>
        </div>
        <Link href="/projects" className="text-xs font-medium text-brand-600 hover:underline">
          View all
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-stone-50 text-sm text-stone-400">
          No active projects.
        </div>
      ) : (
        <ul className="space-y-4">
          {active.map((project) => {
            const pct =
              project.fundedPercent === null
                ? null
                : Math.min(100, Math.max(0, project.fundedPercent));
            return (
              <li key={project.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-stone-800">{project.name}</span>
                  <span className="shrink-0 tabular-nums text-stone-500">
                    {pct === null ? "—" : `${pct}%`}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${pct ?? 0}%` }}
                    role="progressbar"
                    aria-valuenow={pct ?? undefined}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${project.name} funded`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
