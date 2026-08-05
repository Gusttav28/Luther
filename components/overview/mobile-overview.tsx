import { RatesNote } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { KpiCardsMobile, type KpiItem } from "@/components/overview/kpi-cards";
import { CashflowChart } from "@/components/overview/cashflow-chart";
import { BreakdownTabs } from "@/components/overview/breakdown-tabs";
import { HalfMonthSchedule } from "@/components/overview/half-month-schedule";
import { ProjectsProgress } from "@/components/overview/projects-progress";
import { OverviewRefresh } from "@/components/overview/overview-refresh";
import { monthName, type HalfPeriod } from "@/lib/periods";
import type { Currency } from "@/lib/money";
import type { OverviewFigures } from "@/lib/queries/overview";
import type {
  CashflowPoint,
  MomDeltas,
  SpentByCategoryResult,
} from "@/lib/queries/overview-dashboard";
import type { ProjectView } from "@/lib/queries/projects";

export function MobileOverview({
  year,
  month,
  currency,
  usdToCrc,
  kpis,
  mom,
  cashflow,
  spentByCategory,
  overview,
  highlightPeriod,
  projects,
}: {
  year: number;
  month: number;
  currency: Currency;
  usdToCrc: string | null;
  kpis: KpiItem[];
  mom: MomDeltas;
  cashflow: CashflowPoint[];
  spentByCategory: SpentByCategoryResult;
  overview: OverviewFigures;
  highlightPeriod: HalfPeriod | null;
  projects: ProjectView[];
}) {
  return (
    <div className="space-y-[18px] md:hidden">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.01em] text-ink">Overview</h1>
        <p className="mt-1.5 mb-5 text-[13.5px] text-ink-muted">
          {monthName(month)} {year} · Finance analytics
        </p>
        <div className="flex items-center gap-2">
          <MonthPicker year={year} month={month} basePath="/" variant="circles" />
          <OverviewRefresh year={year} month={month} variant="icon" />
        </div>
      </header>

      <KpiCardsMobile items={kpis} currency={currency} mom={mom} />

      <CashflowChart points={cashflow} currency={currency} compact />

      <BreakdownTabs
        spentByCategory={spentByCategory}
        earned={overview.earned}
        spent={overview.spent}
        saved={overview.saved}
        currency={currency}
      />

      <HalfMonthSchedule
        perPeriod={overview.perPeriod}
        currency={currency}
        highlightPeriod={highlightPeriod}
        layout="columns"
      />

      <ProjectsProgress projects={projects} compact />

      <RatesNote usdToCrc={usdToCrc} />
    </div>
  );
}
