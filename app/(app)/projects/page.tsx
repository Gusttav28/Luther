import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getProjectsView } from "@/lib/queries/projects";
import { formatMinor } from "@/lib/money";
import { currentPeriod, periodLabel } from "@/lib/periods";
import { RatesNote } from "@/components/money";
import { AddProjectForm, ApplyAllocationButton, ProjectCard } from "./project-forms";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const userId = await requireUserId();
  const settings = await getSettings(userId);
  const view = await getProjectsView(userId, settings.rates);
  const nowPeriod = currentPeriod();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="page-title">Projects</h1>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="field-label">Allocation per half-month</p>
          <p className="text-lg font-bold tabular-nums">
            {formatMinor(view.allocation.amountMinor, view.allocation.currency)}
          </p>
          <Link href="/settings" className="text-xs text-brand-600 underline">
            Change in settings
          </Link>
        </div>
        <ApplyAllocationButton periodText={periodLabel(nowPeriod)} />
      </div>

      <AddProjectForm />

      {view.projects.length === 0 ? (
        <p className="text-sm text-stone-400">No projects yet — add your first purchase goal.</p>
      ) : (
        <ul className="space-y-4">
          {view.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={{
                id: project.id,
                name: project.name,
                costMinor: project.costMinor,
                currency: project.currency,
                priority: project.priority,
                completed: project.completedAt !== null,
                savedMinor: project.savedMinor,
                fundedPercent: project.fundedPercent,
                affordablePeriod: project.affordablePeriod,
                affordableNow: project.affordableNow,
                projectionPossible: view.projectionPossible,
              }}
            />
          ))}
        </ul>
      )}
      <RatesNote usdToCrc={settings.rates.usdToCrc} mxnToCrc={settings.rates.mxnToCrc} />
    </div>
  );
}
