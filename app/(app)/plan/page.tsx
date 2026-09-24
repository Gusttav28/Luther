import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getPlanMatrix } from "@/lib/queries/plan";
import { RatesNote } from "@/components/money";
import { PlanBoard } from "@/components/plan/plan-board";

export const dynamic = "force-dynamic";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const year = Number(params.year) || new Date().getFullYear();

  const settings = await getSettings(userId);
  const matrix = await getPlanMatrix(userId, year, settings.reportingCurrency, settings.rates);

  return (
    <div className="space-y-3">
      <PlanBoard year={year} currency={settings.reportingCurrency} matrix={matrix} />
      <div className="mx-auto w-full max-w-3xl space-y-1 px-1">
        <p className="text-xs text-ink-faint">
          Plan amounts are entered in CRC (₡); totals and actual spend show in{" "}
          {settings.reportingCurrency}.
        </p>
        <RatesNote usdToCrc={settings.rates.usdToCrc} />
      </div>
    </div>
  );
}
