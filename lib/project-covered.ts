/**
 * Leftover-based project coverage for the Projects screen.
 * Take and cost must already be in the same currency's minor units.
 */

export interface LeftoverProjectCoveredInput {
  costMinor: number;
  /** Leftover project take, or null when FX / waterfall is unavailable. */
  takeMinor: number | null;
}

export interface LeftoverProjectCovered {
  /** min(take, cost) when both are known; never exceeds cost. */
  coveredMinor: number | null;
  fundedPercent: number | null;
  affordableNow: boolean;
}

export function leftoverProjectCovered(
  input: LeftoverProjectCoveredInput
): LeftoverProjectCovered {
  const { costMinor, takeMinor } = input;
  if (takeMinor === null) {
    return { coveredMinor: null, fundedPercent: null, affordableNow: false };
  }

  if (costMinor <= 0) {
    return {
      coveredMinor: takeMinor,
      fundedPercent: null,
      affordableNow: takeMinor >= costMinor,
    };
  }

  return {
    coveredMinor: Math.min(takeMinor, costMinor),
    fundedPercent: Math.min(100, Math.round((takeMinor / costMinor) * 100)),
    affordableNow: takeMinor >= costMinor,
  };
}
