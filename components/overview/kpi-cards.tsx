import { ArrowDown, ArrowUp } from "lucide-react";
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
      className={`mt-1 text-xs font-medium ${up ? "text-positive" : "text-brand-950 dark:text-brand-300"}`}
      aria-label={`${up ? "Up" : "Down"} ${formatted} percent versus prior month`}
    >
      {up ? "↑" : "↓"} {formatted}% MoM
    </p>
  );
}

function MobileDelta({ delta }: { delta: MomDelta | undefined }) {
  if (!delta || delta.percent === null) return null;
  const up = delta.percent >= 0;
  const abs = Math.abs(delta.percent);
  const formatted = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1);
  return (
    <div
      className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
        up ? "text-positive" : "text-red-600 dark:text-red-400"
      }`}
      aria-label={`${up ? "Up" : "Down"} ${formatted} percent versus prior month`}
    >
      {up ? (
        <ArrowUp className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
      ) : (
        <ArrowDown className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
      )}
      {formatted}% MoM
    </div>
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
          <p className="text-xl font-bold tabular-nums tracking-tight text-ink sm:text-2xl">
            <Money minor={item.value} currency={currency} />
          </p>
          {item.key !== "lifetime" ? (
            <DeltaLabel delta={mom[item.key]} />
          ) : (
            <p className="mt-1 text-xs text-ink-faint">Lifetime balance</p>
          )}
        </div>
      ))}
    </div>
  );
}

/** Mobile unified KPI card: 2×2 monthly KPIs + lifetime footer. */
export function KpiCardsMobile({
  items,
  currency,
  mom,
}: {
  items: KpiItem[];
  currency: Currency;
  mom: MomDeltas;
}) {
  const monthly = items.filter(
    (item): item is KpiItem & { key: Exclude<KpiItem["key"], "lifetime"> } =>
      item.key !== "lifetime",
  );
  const lifetime = items.find((item) => item.key === "lifetime");

  return (
    <section className="card !rounded-[20px] !px-5 !pb-0 !pt-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {monthly.map((item) => (
          <div key={item.key}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              {item.label}
            </p>
            <p className="mt-1 text-[22px] font-bold tabular-nums tracking-tight text-ink">
              <Money minor={item.value} currency={currency} />
            </p>
            <MobileDelta delta={mom[item.key]} />
          </div>
        ))}
      </div>
      {lifetime ? (
        <div className="mt-[18px] flex items-center justify-between border-t border-line py-3.5">
          <span className="text-[12.5px] text-ink-muted">Lifetime balance</span>
          <span className="text-[15px] font-semibold tabular-nums text-ink">
            <Money minor={lifetime.value} currency={currency} />
          </span>
        </div>
      ) : null}
    </section>
  );
}
