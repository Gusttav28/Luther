import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getSavings } from "@/lib/queries/savings";
import { Money, RatesNote } from "@/components/money";
import { AddSavingsForm, SavingsListRow } from "./savings-forms";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const userId = await requireUserId();
  const now = new Date();
  const settings = await getSettings(userId);
  const data = await getSavings(userId, settings.reportingCurrency, settings.rates, {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const defaultDate = now.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Lifetime savings</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card bg-brand-600 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-100">
            Lifetime balance
          </p>
          <p className="text-2xl font-bold tabular-nums">
            <Money minor={data.balanceMinor} currency={settings.reportingCurrency} />
          </p>
        </div>
        <div className="card">
          <p className="field-label">Saved this month</p>
          <p className="text-2xl font-bold tabular-nums">
            <Money minor={data.monthTotalMinor} currency={settings.reportingCurrency} />
          </p>
        </div>
      </div>
      <RatesNote usdToCrc={settings.rates.usdToCrc} mxnToCrc={settings.rates.mxnToCrc} />

      <AddSavingsForm defaultDate={defaultDate} />

      <section className="card">
        <h2 className="text-base font-semibold">History</h2>
        {data.contributions.length === 0 ? (
          <p className="py-3 text-sm text-stone-400">No contributions yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {data.contributions.map((row) => (
              <SavingsListRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
