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

export interface ProjectView {
  id: string;
  name: string;
  costMinor: number;
  currency: Currency;
  priority: number;
  completedAt: Date | null;
  /** Recorded contributions total, in the project's own currency. Null = rate missing. */
  savedMinor: number | null;
  fundedPercent: number | null;
  /** Projected first affordable period; null when no projection is possible. */
  affordablePeriod: PeriodRef | null;
  affordableNow: boolean;
}

export interface ProjectsView {
  projects: ProjectView[];
  allocation: { amountMinor: number; currency: Currency };
  projectionPossible: boolean;
}

export async function getProjectsView(
  userId: string,
  rates: Rates,
  now: Date = new Date()
): Promise<ProjectsView> {
  const [projects, allocationRow, contributions] = await Promise.all([
    prisma.project.findMany({ where: { userId }, orderBy: { priority: "asc" } }),
    prisma.allocationSetting.findUnique({ where: { userId } }),
    prisma.projectContribution.findMany({ where: { userId } }),
  ]);

  const allocation = {
    amountMinor: allocationRow?.amountMinor ?? 0,
    currency: (allocationRow?.currency ?? "CRC") as Currency,
  };

  // Work in the allocation's currency so allocation math is exact.
  const common: Currency = allocation.currency;

  const active = projects.filter((p) => !p.completedAt);
  const inputs: Array<{ id: string; costMinor: number; savedMinor: number; priority: number }> =
    [];
  let conversionFailed = false;

  const savedByProject = new Map<string, number | null>();
  for (const project of projects) {
    const own = sumInCurrency(
      contributions
        .filter((c) => c.projectId === project.id)
        .map((c) => ({ amountMinor: c.amountMinor, currency: c.currency as Currency })),
      project.currency as Currency,
      rates
    );
    savedByProject.set(project.id, own);
  }

  for (const project of active) {
    try {
      const cost = convertMinor(project.costMinor, project.currency as Currency, common, rates);
      const saved = sumInCurrency(
        contributions
          .filter((c) => c.projectId === project.id)
          .map((c) => ({ amountMinor: c.amountMinor, currency: c.currency as Currency })),
        common,
        rates
      );
      if (saved === null) throw new MissingRateError("USD");
      inputs.push({ id: project.id, costMinor: cost, savedMinor: saved, priority: project.priority });
    } catch (error) {
      if (error instanceof MissingRateError) {
        conversionFailed = true;
        break;
      }
      throw error;
    }
  }

  const projectionPossible = allocation.amountMinor > 0 && !conversionFailed;
  const projections = projectionPossible
    ? projectAffordability(inputs, allocation.amountMinor, nextPeriod(currentPeriod(now)))
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
    return {
      id: project.id,
      name: project.name,
      costMinor: project.costMinor,
      currency: project.currency as Currency,
      priority: project.priority,
      completedAt: project.completedAt,
      savedMinor: saved,
      fundedPercent,
      affordablePeriod: projection?.affordablePeriod ?? null,
      affordableNow,
    };
  });

  return { projects: views, allocation, projectionPossible };
}
