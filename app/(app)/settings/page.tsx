import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { formatMinor } from "@/lib/money";
import { SettingsForm } from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const settings = await getSettings(userId);

  const startingBalanceStr = (settings.startingBalanceMinor / 100).toFixed(2);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="page-title">Settings</h1>
      <SettingsForm
        usdToCrcRate={settings.rates.usdToCrc ?? ""}
        reportingCurrency={settings.reportingCurrency}
        startingBalance={startingBalanceStr}
        startingBalanceCurrency={settings.startingBalanceCurrency}
      />
      <p className="text-xs text-ink-faint">
        Current starting balance:{" "}
        {formatMinor(settings.startingBalanceMinor, settings.startingBalanceCurrency)}. Project
        funding uses percentage of leftover after lifetime savings (set on each project).
      </p>
    </div>
  );
}
