import { prisma } from "@/lib/prisma";
import {
  convertMinor,
  MissingRateError,
  type Currency,
  type Rates,
} from "@/lib/money";
import { currentPeriod, nextPeriod, type PeriodRef } from "@/lib/periods";
import { leftoverProjectCovered } from "@/lib/project-covered";
import { projectAffordability } from "@/lib/projections";
import { type PeriodMode } from "@/lib/waterfall";
import { getScopeAmounts, materializeMonthWaterfall, waterfallFromScope } from "@/lib/queries/waterfall-scope";
import { getSettings } from "@/lib/queries/settings";

export interface ProjectView {
  id: string;
  name: string;
  costMinor: number;
  currency: Currency;
  priority: number;
  allocationPercent: number;
  periodMode: PeriodMode;
  goalDate: Date | null;
  link: string | null;
  isPriority: boolean;
  completedAt: Date | null;
  /** Leftover project take in the project currency, capped at cost. */
  savedMinor: number | null;
  fundedPercent: number | null;
  affordablePeriod: PeriodRef | null;
  affordableNow: boolean;
  /** Expected take this period from waterfall (active priority only), reporting currency. */
  expectedTakeMinor: number | null;
}

export interface ProjectsView {
  projects: ProjectView[];
  /** Post-lifetime leftover for current month (BOTH), reporting currency. */
  postLifetimeMinor: number | null;
  projectionPossible: boolean;
}

function leftoverTakeReporting(
  project: { isPriority: boolean; completedAt: Date | null; allocationPercent: number },
  monthScope: Parameters<typeof waterfallFromScope>[0],
  monthWaterfall: ReturnType<typeof waterfallFromScope>
): number | null {
  if (!monthWaterfall) return null;
  if (!project.isPriority || project.completedAt) return 0;
  return waterfallFromScope(monthScope, project.allocationPercent)?.projectTakeMinor ?? 0;
}

function takeInProjectCurrency(
  takeReporting: number | null,
  reporting: Currency,
  projectCurrency: Currency,
  rates: Rates
): number | null {
  if (takeReporting === null) return null;
  try {
    return convertMinor(takeReporting, reporting, projectCurrency, rates);
  } catch (error) {
    if (error instanceof MissingRateError) return null;
    throw error;
  }
}

export async function getProjectsView(
  userId: string,
  rates: Rates,
  now: Date = new Date(),
  options?: { skipMaterialize?: boolean; materialize?: boolean }
): Promise<ProjectsView> {
  const settings = await getSettings(userId);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (options?.materialize === true || options?.skipMaterialize === false) {
    await materializeMonthWaterfall(userId, year, month, settings.reportingCurrency, rates);
  }

  const [projects, monthScope] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: [{ isPriority: "desc" }, { priority: "asc" }],
    }),
    getScopeAmounts(userId, year, month, "BOTH", settings.reportingCurrency, rates),
  ]);

  const monthWaterfall = waterfallFromScope(monthScope);

  const priority = projects.find((p) => p.isPriority && !p.completedAt);
  const allocationPerPeriod =
    priority && monthWaterfall
      ? leftoverTakeReporting(priority, monthScope, monthWaterfall) ?? 0
      : 0;
  // BOTH mode: treat monthly take as ~2 halves for projection step size
  const perHalf =
    priority?.periodMode === "BOTH" ? Math.floor(allocationPerPeriod / 2) : allocationPerPeriod;

  const common: Currency = settings.reportingCurrency;
  const inputs: Array<{ id: string; costMinor: number; savedMinor: number; priority: number }> = [];
  let conversionFailed = false;

  if (priority && monthWaterfall) {
    try {
      const cost = convertMinor(priority.costMinor, priority.currency as Currency, common, rates);
      const saved = leftoverTakeReporting(priority, monthScope, monthWaterfall);
      if (saved === null) throw new MissingRateError();
      inputs.push({ id: priority.id, costMinor: cost, savedMinor: saved, priority: 1 });
    } catch (error) {
      if (error instanceof MissingRateError) conversionFailed = true;
      else throw error;
    }
  }

  const projectionPossible = perHalf > 0 && !conversionFailed && inputs.length > 0;
  const projections = projectionPossible
    ? projectAffordability(inputs, perHalf, nextPeriod(currentPeriod(now)))
    : [];
  const projectionById = new Map(projections.map((p) => [p.id, p]));

  const views: ProjectView[] = projects.map((project) => {
    const takeReporting = leftoverTakeReporting(project, monthScope, monthWaterfall);
    const takeInProject = takeInProjectCurrency(
      takeReporting,
      common,
      project.currency as Currency,
      rates
    );
    const covered = leftoverProjectCovered({
      costMinor: project.costMinor,
      takeMinor: takeInProject,
    });
    const projection = projectionById.get(project.id);
    const expectedTakeMinor =
      project.isPriority && !project.completedAt && monthWaterfall ? takeReporting : null;
    return {
      id: project.id,
      name: project.name,
      costMinor: project.costMinor,
      currency: project.currency as Currency,
      priority: project.priority,
      allocationPercent: project.allocationPercent,
      periodMode: project.periodMode as PeriodMode,
      goalDate: project.goalDate,
      link: project.link,
      isPriority: project.isPriority,
      completedAt: project.completedAt,
      savedMinor: covered.coveredMinor,
      fundedPercent: covered.fundedPercent,
      affordablePeriod: projection?.affordablePeriod ?? null,
      affordableNow: covered.affordableNow,
      expectedTakeMinor,
    };
  });

  return {
    projects: views,
    postLifetimeMinor: monthWaterfall?.postLifetimeMinor ?? null,
    projectionPossible,
  };
}
