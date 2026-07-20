import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getIncomeForMonth } from "@/lib/queries/income";
import { Money, RatesNote } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { AddIncomeForm, IncomeEntryRow } from "./income-forms";

export const dynamic = "force-dynamic";

export default async function IncomePage({
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
  const data = await getIncomeForMonth(
    userId,
    year,
    month,
    settings.reportingCurrency,
    settings.rates
  );

  const h1 = data.entries.filter((e) => e.period === "H1");
  const h2 = data.entries.filter((e) => e.period === "H2");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Income</h1>
        <MonthPicker year={year} month={month} basePath="/income" />
      </div>

      <AddIncomeForm year={year} month={month} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="field-label">H1 total (1–15)</p>
          <p className="text-lg font-bold tabular-nums">
            <Money minor={data.totalH1} currency={settings.reportingCurrency} />
          </p>
        </div>
        <div className="card">
          <p className="field-label">H2 total (16–end)</p>
          <p className="text-lg font-bold tabular-nums">
            <Money minor={data.totalH2} currency={settings.reportingCurrency} />
          </p>
        </div>
        <div className="card">
          <p className="field-label">Month total</p>
          <p className="text-lg font-bold tabular-nums">
            <Money minor={data.totalMonth} currency={settings.reportingCurrency} />
          </p>
        </div>
      </div>
      <RatesNote usdToCrc={settings.rates.usdToCrc} mxnToCrc={settings.rates.mxnToCrc} />

      {[
        { title: "First half (1–15)", entries: h1 },
        { title: "Second half (16–end)", entries: h2 },
      ].map((section) => (
        <section key={section.title} className="card">
          <h2 className="text-base font-semibold">{section.title}</h2>
          {section.entries.length === 0 ? (
            <p className="py-3 text-sm text-stone-400">No entries.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {section.entries.map((entry) => (
                <IncomeEntryRow key={entry.id} entry={entry} year={year} month={month} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
