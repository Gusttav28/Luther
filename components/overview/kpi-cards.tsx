import { Money } from "@/components/money";
import type { Currency } from "@/lib/money";
import type { MomDelta, MomDeltas } from "@/lib/queries/overview-dashboard";

export interface KpiItem {
  key: "earned" | "spent" | "saved" | "remaining" | "lifetime";
  label: string;
  value: number | null;
}

function DeltaLabel({ delta }: { delta: MomDelta | undefined }) {
  if (!delta || delta.percent === null) return null;
  const up = delta.percent >= 0;
  const abs = Math.abs(delta.percent);
  const formatted = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1);
  return (
    <p
      className={`mt-1 text-xs font-medium ${up ? "text-positive" : "text-brand-600"}`}
      aria-label={`${up ? "Up" : "Down"} ${formatted} percent versus prior month`}
    >
      {up ? "↑" : "↓"} {formatted}% MoM
    </p>
  );
}

export function KpiCards({
  items,
  currency,
  mom,
}: {
  items: KpiItem[];
  currency: Currency;
  mom: MomDeltas;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.key} className="card">
          <p className="field-label">{item.label}</p>
          <p className="text-xl font-bold tabular-nums tracking-tight text-stone-900 sm:text-2xl">
            <Money minor={item.value} currency={currency} />
          </p>
          {item.key !== "lifetime" ? <DeltaLabel delta={mom[item.key]} /> : (
            <p className="mt-1 text-xs text-stone-400">Lifetime balance</p>
          )}
        </div>
      ))}
    </div>
  );
}
