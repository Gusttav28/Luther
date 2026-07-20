import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getOverview } from "@/lib/queries/overview";
import { getProjectsView } from "@/lib/queries/projects";
import {
  computeMomDeltas,
  getCashflowSeries,
  getSpentByCategory,
  priorMonth,
} from "@/lib/queries/overview-dashboard";
import { RatesNote } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { KpiCards } from "@/components/overview/kpi-cards";
import { CashflowChart } from "@/components/overview/cashflow-chart";
import { SpentByCategory } from "@/components/overview/spent-by-category";
import { CompositionDonut } from "@/components/overview/composition-donut";
import { HalfMonthSchedule } from "@/components/overview/half-month-schedule";
import { ProjectsProgress } from "@/components/overview/projects-progress";
import { OverviewRefresh } from "@/components/overview/overview-refresh";
import { currentPeriod, monthName, type HalfPeriod } from "@/lib/periods";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const settings = await getSettings(userId);
  const prior = priorMonth(year, month);

  const [overview, priorOverview, spentByCategory, cashflow, projectsView] =
    await Promise.all([
      getOverview(userId, year, month, settings.reportingCurrency, settings.rates),
      getOverview(
        userId,
        prior.year,
        prior.month,
        settings.reportingCurrency,
        settings.rates
      ),
      getSpentByCategory(userId, year, month, settings.reportingCurrency, settings.rates),
      getCashflowSeries(userId, year, month, settings.reportingCurrency, settings.rates),
      getProjectsView(userId, settings.rates),
    ]);

  const mom = computeMomDeltas(overview, priorOverview);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const highlightPeriod: HalfPeriod | null = isCurrentMonth
    ? currentPeriod(now).period
    : null;

  const kpis = [
    { key: "earned" as const, label: "Earned", value: overview.earned },
    { key: "spent" as const, label: "Spent", value: overview.spent },
    { key: "saved" as const, label: "Saved", value: overview.saved },
    { key: "remaining" as const, label: "Remaining", value: overview.remaining },
    {
      key: "lifetime" as const,
      label: "Lifetime savings",
      value: overview.lifetimeSavingsBalance,
    },
  ];

  // Serialize Date fields for client boundaries (projects only used server-side here).
  return (
    <div className="mx-auto max-w-7xl space-y-6 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            {monthName(month)} {year} · Finance analytics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker year={year} month={month} basePath="/" />
          <OverviewRefresh />
        </div>
      </div>

      <KpiCards items={kpis} currency={settings.reportingCurrency} mom={mom} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CashflowChart points={cashflow} currency={settings.reportingCurrency} />
        </div>
        <div className="lg:col-span-2">
          <SpentByCategory data={spentByCategory} currency={settings.reportingCurrency} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CompositionDonut
          earned={overview.earned}
          spent={overview.spent}
          saved={overview.saved}
          currency={settings.reportingCurrency}
        />
        <HalfMonthSchedule
          perPeriod={overview.perPeriod}
          currency={settings.reportingCurrency}
          highlightPeriod={highlightPeriod}
        />
        <ProjectsProgress projects={projectsView.projects} />
      </div>

      <RatesNote usdToCrc={settings.rates.usdToCrc} mxnToCrc={settings.rates.mxnToCrc} />
    </div>
  );
}
