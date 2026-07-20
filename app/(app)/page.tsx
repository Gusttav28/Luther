import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getOverview } from "@/lib/queries/overview";
import { Money, RatesNote } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";

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
  const overview = await getOverview(
    userId,
    year,
    month,
    settings.reportingCurrency,
    settings.rates
  );

  const cards = [
    { label: "Earned", value: overview.earned, tone: "text-brand-700" },
    { label: "Spent", value: overview.spent, tone: "text-red-600" },
    { label: "Saved", value: overview.saved, tone: "text-sky-600" },
    { label: "Remaining", value: overview.remaining, tone: "text-stone-900" },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <MonthPicker year={year} month={month} basePath="/" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <p className="field-label">{card.label}</p>
            <p className={`text-xl font-bold tabular-nums ${card.tone}`}>
              <Money minor={card.value} currency={settings.reportingCurrency} />
            </p>
          </div>
        ))}
      </div>

      <div className="card bg-brand-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-100">
              Lifetime savings balance
            </p>
            <p className="text-2xl font-bold tabular-nums">
              <Money
                minor={overview.lifetimeSavingsBalance}
                currency={settings.reportingCurrency}
              />
            </p>
          </div>
          <Link
            href="/savings"
            className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
          >
            Manage
          </Link>
        </div>
      </div>

      <section className="card">
        <h2 className="mb-3 text-base font-semibold">Half-month breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Period
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  Earned
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  Spent
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Saved
                </th>
              </tr>
            </thead>
            <tbody>
              {(["H1", "H2"] as const).map((period) => (
                <tr key={period} className="border-b border-stone-100 last:border-0">
                  <th scope="row" className="py-2 pr-4 text-left font-medium">
                    {period === "H1" ? "1st – 15th" : "16th – end"}
                  </th>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    <Money
                      minor={overview.perPeriod[period].earned}
                      currency={settings.reportingCurrency}
                    />
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    <Money
                      minor={overview.perPeriod[period].spent}
                      currency={settings.reportingCurrency}
                    />
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    <Money
                      minor={overview.perPeriod[period].saved}
                      currency={settings.reportingCurrency}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <RatesNote usdToCrc={settings.rates.usdToCrc} mxnToCrc={settings.rates.mxnToCrc} />
    </div>
  );
}
