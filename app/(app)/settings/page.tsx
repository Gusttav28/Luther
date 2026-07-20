import { requireUserId } from "@/lib/auth";
import { getSettings, getAllocation } from "@/lib/queries/settings";
import { formatMinor } from "@/lib/money";
import { SettingsForm, AllocationForm } from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const [settings, allocation] = await Promise.all([
    getSettings(userId),
    getAllocation(userId),
  ]);

  const startingBalanceStr = (settings.startingBalanceMinor / 100).toFixed(2);
  const allocationStr = (allocation.amountMinor / 100).toFixed(2);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="page-title">Settings</h1>
      <SettingsForm
        usdToCrcRate={settings.rates.usdToCrc ?? ""}
        mxnToCrcRate={settings.rates.mxnToCrc ?? ""}
        reportingCurrency={settings.reportingCurrency}
        startingBalance={startingBalanceStr}
        startingBalanceCurrency={settings.startingBalanceCurrency}
      />
      <AllocationForm amount={allocationStr} currency={allocation.currency} />
      <p className="text-xs text-stone-400">
        Current starting balance:{" "}
        {formatMinor(settings.startingBalanceMinor, settings.startingBalanceCurrency)} · Allocation:{" "}
        {formatMinor(allocation.amountMinor, allocation.currency)} per half-month.
      </p>
    </div>
  );
}
