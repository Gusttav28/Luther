"use client";

import { useId, useState } from "react";
import { SpentByCategory } from "@/components/overview/spent-by-category";
import { CompositionDonut } from "@/components/overview/composition-donut";
import type { Currency } from "@/lib/money";
import type { SpentByCategoryResult } from "@/lib/queries/overview-dashboard";

type BreakdownTab = "category" | "composition";

export function BreakdownTabs({
  spentByCategory,
  earned,
  spent,
  saved,
  currency,
}: {
  spentByCategory: SpentByCategoryResult;
  earned: number | null;
  spent: number | null;
  saved: number | null;
  currency: Currency;
}) {
  const [tab, setTab] = useState<BreakdownTab>("category");
  const baseId = useId();
  const categoryPanelId = `${baseId}-category`;
  const compositionPanelId = `${baseId}-composition`;

  return (
    <section className="card !rounded-[20px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="section-title">Breakdown</h2>
          <p className="mt-1 text-[12.5px] text-ink-muted">By category or composition</p>
        </div>
        <div
          className="flex shrink-0 rounded-[10px] bg-surface-muted p-0.5"
          role="tablist"
          aria-label="Breakdown view"
        >
          <button
            type="button"
            role="tab"
            id={`${baseId}-tab-category`}
            aria-selected={tab === "category"}
            aria-controls={categoryPanelId}
            onClick={() => setTab("category")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              tab === "category"
                ? "bg-surface-card text-ink shadow-sm"
                : "bg-transparent text-ink-muted"
            }`}
          >
            Category
          </button>
          <button
            type="button"
            role="tab"
            id={`${baseId}-tab-composition`}
            aria-selected={tab === "composition"}
            aria-controls={compositionPanelId}
            onClick={() => setTab("composition")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              tab === "composition"
                ? "bg-surface-card text-ink shadow-sm"
                : "bg-transparent text-ink-muted"
            }`}
          >
            Composition
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        id={categoryPanelId}
        aria-labelledby={`${baseId}-tab-category`}
        hidden={tab !== "category"}
        className="mt-[18px]"
      >
        {tab === "category" ? (
          <SpentByCategory data={spentByCategory} currency={currency} variant="embedded" />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={compositionPanelId}
        aria-labelledby={`${baseId}-tab-composition`}
        hidden={tab !== "composition"}
      >
        {tab === "composition" ? (
          <CompositionDonut
            earned={earned}
            spent={spent}
            saved={saved}
            currency={currency}
            embedded
          />
        ) : null}
      </div>
    </section>
  );
}
