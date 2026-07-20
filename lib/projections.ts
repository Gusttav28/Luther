/**
 * Pure project-funding projection math (R9), unit-testable without a DB.
 *
 * Past funding comes from recorded ProjectContribution rows (savedMinor).
 * Future periods are simulated: each half-month period the fixed allocation
 * is applied to the highest-priority incomplete project until it is fully
 * funded, then overflow rolls to the next project in the same period.
 */
import { nextPeriod, type PeriodRef } from "./periods";

export interface ProjectionInput {
  id: string;
  /** Cost in a common currency's minor units (already converted). */
  costMinor: number;
  /** Recorded contributions to date, same currency. */
  savedMinor: number;
  /** Lower number = higher priority. */
  priority: number;
}

export interface ProjectionResult {
  id: string;
  /** First period in which cumulative funding ≥ cost; null = no projection. */
  affordablePeriod: PeriodRef | null;
  /** Simulated saved amount at affordability (= cost when reachable). */
  fundedPercent: number;
}

const MAX_SIMULATED_PERIODS = 24 * 30; // 30 years — beyond this, treat as unreachable

export function projectAffordability(
  projects: ProjectionInput[],
  allocationPerPeriodMinor: number,
  firstFuturePeriod: PeriodRef
): ProjectionResult[] {
  const ordered = [...projects].sort((a, b) => a.priority - b.priority);
  const results = new Map<string, ProjectionResult>();
  const remaining = ordered.map((p) => ({
    id: p.id,
    needed: Math.max(0, p.costMinor - p.savedMinor),
    fundedPercent:
      p.costMinor > 0 ? Math.min(100, Math.round((p.savedMinor / p.costMinor) * 100)) : 100,
  }));

  // Already-affordable projects need no simulation.
  let period = firstFuturePeriod;
  for (const p of remaining) {
    if (p.needed === 0) {
      results.set(p.id, {
        id: p.id,
        affordablePeriod: null, // affordable now — callers show "affordable now"
        fundedPercent: p.fundedPercent,
      });
    }
  }

  if (allocationPerPeriodMinor <= 0) {
    for (const p of remaining) {
      if (!results.has(p.id)) {
        results.set(p.id, { id: p.id, affordablePeriod: null, fundedPercent: p.fundedPercent });
      }
    }
    return ordered.map((p) => results.get(p.id)!);
  }

  const queue = remaining.filter((p) => p.needed > 0);
  let steps = 0;
  while (queue.length > 0 && steps < MAX_SIMULATED_PERIODS) {
    let available = allocationPerPeriodMinor;
    while (available > 0 && queue.length > 0) {
      const head = queue[0];
      const applied = Math.min(available, head.needed);
      head.needed -= applied;
      available -= applied;
      if (head.needed === 0) {
        results.set(head.id, {
          id: head.id,
          affordablePeriod: period,
          fundedPercent: head.fundedPercent,
        });
        queue.shift();
      }
    }
    period = nextPeriod(period);
    steps += 1;
  }

  for (const p of queue) {
    results.set(p.id, { id: p.id, affordablePeriod: null, fundedPercent: p.fundedPercent });
  }

  return ordered.map((p) => results.get(p.id)!);
}
