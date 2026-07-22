import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getProjectsView } from "@/lib/queries/projects";
import { Money, RatesNote } from "@/components/money";
import { ProjectProgressChart } from "@/components/charts/project-progress-chart";
import { AddProjectForm, ProjectCard } from "./project-forms";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const userId = await requireUserId();
  const settings = await getSettings(userId);
  const view = await getProjectsView(userId, settings.rates);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="page-title">Projects</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="field-label">Active projects</p>
          <p className="text-2xl font-bold tabular-nums">
            {view.projects.filter((project) => !project.completedAt).length}
          </p>
          <p className="text-xs text-ink-faint">of {view.projects.length} total</p>
        </div>
        <div className="card">
          <p className="field-label">Left after lifetime savings</p>
          <p className="text-2xl font-bold tabular-nums">
            <Money minor={view.postLifetimeMinor} currency={settings.reportingCurrency} />
          </p>
          <p className="text-xs text-ink-faint">Priority project takes up to 70% of this</p>
        </div>
      </div>
      <ProjectProgressChart projects={view.projects} />

      <AddProjectForm />

      {view.projects.length === 0 ? (
        <p className="text-sm text-ink-faint">No projects yet — add your first purchase goal.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {view.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={{
                id: project.id,
                name: project.name,
                costMinor: project.costMinor,
                currency: project.currency,
                priority: project.priority,
                allocationPercent: project.allocationPercent,
                periodMode: project.periodMode,
                goalDate: project.goalDate,
                link: project.link,
                isPriority: project.isPriority,
                completed: project.completedAt !== null,
                savedMinor: project.savedMinor,
                fundedPercent: project.fundedPercent,
                affordablePeriod: project.affordablePeriod,
                affordableNow: project.affordableNow,
                projectionPossible: view.projectionPossible,
                expectedTakeMinor: project.expectedTakeMinor,
                reportingCurrency: settings.reportingCurrency,
              }}
            />
          ))}
        </ul>
      )}
      <RatesNote usdToCrc={settings.rates.usdToCrc} />
    </div>
  );
}
