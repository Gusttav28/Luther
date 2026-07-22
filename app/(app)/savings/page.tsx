import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getSavings } from "@/lib/queries/savings";
import { Money, RatesNote } from "@/components/money";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { convertMinor, MissingRateError, formatMinor } from "@/lib/money";
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
  const monthly = new Map<string, { label: string; contributions: number; withdrawals: number }>();
  let conversionUnavailable = false;
  let contributionsTotal = 0;
  let withdrawalsTotal = 0;
  for (const row of data.contributions) {
    let converted: number;
    try {
      converted = convertMinor(row.amountMinor, row.currency, settings.reportingCurrency, settings.rates);
    } catch (error) {
      if (error instanceof MissingRateError) {
        conversionUnavailable = true;
        continue;
      }
      throw error;
    }
    const key = `${row.date.getFullYear()}-${row.date.getMonth()}`;
    const item = monthly.get(key) ?? {
      label: row.date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      contributions: 0,
      withdrawals: 0,
    };
    if (converted >= 0) {
      item.contributions += converted;
      contributionsTotal += converted;
    } else {
      item.withdrawals += Math.abs(converted);
      withdrawalsTotal += Math.abs(converted);
    }
    monthly.set(key, item);
  }
  const savingsTrend = conversionUnavailable ? [] : [...monthly.values()].reverse();
  if (conversionUnavailable) {
    contributionsTotal = 0;
    withdrawalsTotal = 0;
  }

  const defaultDate = now.toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="page-title">Lifetime savings</h1>
        <RatesNote usdToCrc={settings.rates.usdToCrc} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Savings summary">
        <div className="card">
          <p className="field-label">Lifetime balance</p>
          <p className="text-2xl font-bold tabular-nums text-ink">
            <Money minor={data.balanceMinor} currency={settings.reportingCurrency} />
          </p>
        </div>
        <div className="card">
          <p className="field-label">Budget left after expenses</p>
          <p className="text-2xl font-bold tabular-nums text-ink">
            <Money minor={data.leftoverMinor} currency={settings.reportingCurrency} />
          </p>
        </div>
        <div className="card">
          <p className="field-label">Lifetime take (70%)</p>
          <p className="text-2xl font-bold tabular-nums text-ink">
            <Money minor={data.lifetimeTakeMinor} currency={settings.reportingCurrency} />
          </p>
        </div>
        <div className="card">
          <p className="field-label">Left for projects (30%)</p>
          <p className="text-2xl font-bold tabular-nums text-ink">
            <Money minor={data.postLifetimeMinor} currency={settings.reportingCurrency} />
          </p>
        </div>
      </section>

      <p className="text-sm text-ink-muted">
        Lifetime savings are always <strong className="font-semibold text-ink">70%</strong> of what
        remains after expenses from your planned income. Use the form below only for manual
        adjustments or withdrawals.
      </p>

      <section className="grid min-w-0 gap-4 md:grid-cols-2" aria-label="Savings analytics">
        <BarChart
          title="Savings contributions over time"
          subtitle="Positive contributions and withdrawals by month."
          data={savingsTrend}
          series={[
            { key: "contributions", name: "Contributions", color: "#3d9b6a" },
            { key: "withdrawals", name: "Withdrawals", color: "#737373" },
          ]}
          currency={settings.reportingCurrency}
          emptyMessage={conversionUnavailable ? "Unavailable until rates are set." : "No savings activity yet."}
        />
        <DonutChart
          title="Contributions versus withdrawals"
          subtitle="Signed savings rows grouped by direction; notes are not categories."
          segments={[
            { key: "contributions", name: "Contributions", value: contributionsTotal, color: "#3d9b6a" },
            { key: "withdrawals", name: "Withdrawals", value: withdrawalsTotal, color: "#737373" },
          ]}
          currency={settings.reportingCurrency}
          centerLabel={conversionUnavailable ? "Unavailable" : formatMinor(contributionsTotal + withdrawalsTotal, settings.reportingCurrency)}
          centerSubLabel="Activity"
          emptyMessage={conversionUnavailable ? "Unavailable until rates are set." : "No savings activity yet."}
        />
      </section>

      <section aria-label="Record savings">
        <AddSavingsForm defaultDate={defaultDate} />
      </section>

      <section className="card">
        <h2 className="text-base font-semibold">History</h2>
        {data.contributions.length === 0 ? (
          <p className="py-3 text-sm text-ink-faint">No contributions yet.</p>
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
