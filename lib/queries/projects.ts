import { prisma } from "@/lib/prisma";
import {
  convertMinor,
  MissingRateError,
  sumInCurrency,
  type Currency,
  type Rates,
} from "@/lib/money";
import { currentPeriod, nextPeriod, type PeriodRef } from "@/lib/periods";
import { projectAffordability } from "@/lib/projections";
import { computeWaterfall, type PeriodMode } from "@/lib/waterfall";
import { getScopeAmounts, materializeMonthWaterfall } from "@/lib/queries/waterfall-scope";
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
  savedMinor: number | null;
  fundedPercent: number | null;
  affordablePeriod: PeriodRef | null;
  affordableNow: boolean;
  /** Expected take this period from waterfall (priority only). */
  expectedTakeMinor: number | null;
}

export interface ProjectsView {
  projects: ProjectView[];
  /** Post-lifetime leftover for current month (BOTH), reporting currency. */
  postLifetimeMinor: number | null;
  projectionPossible: boolean;
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

  const [projects, contributionSums, monthScope] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: [{ isPriority: "desc" }, { priority: "asc" }],
    }),
    prisma.projectContribution.groupBy({
      by: ["projectId", "currency"],
      where: { userId },
      _sum: { amountMinor: true },
    }),
    getScopeAmounts(userId, year, month, "BOTH", settings.reportingCurrency, rates),
  ]);

  const monthWaterfall =
    monthScope.plannedIncomeMinor !== null && monthScope.expensesMinor !== null
      ? computeWaterfall({
          plannedIncomeMinor: monthScope.plannedIncomeMinor,
          expensesMinor: monthScope.expensesMinor,
        })
      : null;

  const priority = projects.find((p) => p.isPriority && !p.completedAt);
  const allocationPerPeriod =
    priority && monthWaterfall
      ? computeWaterfall({
          plannedIncomeMinor: monthScope.plannedIncomeMinor!,
          expensesMinor: monthScope.expensesMinor!,
          projectAllocationPercent: priority.allocationPercent,
        }).projectTakeMinor
      : 0;
  // BOTH mode: treat monthly take as ~2 halves for projection step size
  const perHalf =
    priority?.periodMode === "BOTH" ? Math.floor(allocationPerPeriod / 2) : allocationPerPeriod;

  const common: Currency = settings.reportingCurrency;
  const inputs: Array<{ id: string; costMinor: number; savedMinor: number; priority: number }> = [];
  let conversionFailed = false;

  const rowsByProject = new Map<string, Array<{ amountMinor: number; currency: Currency }>>();
  for (const row of contributionSums) {
    const list = rowsByProject.get(row.projectId) ?? [];
    list.push({
      amountMinor: row._sum.amountMinor ?? 0,
      currency: row.currency as Currency,
    });
    rowsByProject.set(row.projectId, list);
  }

  const savedByProject = new Map<string, number | null>();
  for (const project of projects) {
    const own = sumInCurrency(
      rowsByProject.get(project.id) ?? [],
      project.currency as Currency,
      rates
    );
    savedByProject.set(project.id, own);
  }

  // Only simulate the priority project for affordability
  if (priority) {
    try {
      const cost = convertMinor(priority.costMinor, priority.currency as Currency, common, rates);
      const saved = sumInCurrency(rowsByProject.get(priority.id) ?? [], common, rates);
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
    const saved = savedByProject.get(project.id) ?? null;
    const projection = projectionById.get(project.id);
    const fundedPercent =
      saved === null || project.costMinor === 0
        ? null
        : Math.min(100, Math.round((saved / project.costMinor) * 100));
    const affordableNow = fundedPercent !== null && saved !== null && saved >= project.costMinor;
    const expectedTakeMinor =
      project.isPriority && monthWaterfall
        ? computeWaterfall({
            plannedIncomeMinor: monthScope.plannedIncomeMinor!,
            expensesMinor: monthScope.expensesMinor!,
            projectAllocationPercent: project.allocationPercent,
          }).projectTakeMinor
        : null;
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
      savedMinor: saved,
      fundedPercent,
      affordablePeriod: projection?.affordablePeriod ?? null,
      affordableNow,
      expectedTakeMinor,
    };
  });

  return {
    projects: views,
    postLifetimeMinor: monthWaterfall?.postLifetimeMinor ?? null,
    projectionPossible,
  };
}
