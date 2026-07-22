import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getExpenses, getActiveCategories, getAllCategories } from "@/lib/queries/expenses";
import { formatMinor } from "@/lib/money";
import { DonutChart } from "@/components/charts/donut-chart";
import { AddExpenseForm, ExpenseListRow } from "./expense-forms";
import { ExpensesTable, type HalfFilter } from "./expenses-table";
import { ExportPlanButton } from "./export-plan-button";
import { ExpensesMonthFrame } from "./expenses-month-frame";
import { CHART_PALETTE } from "@/lib/chart-colors";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS = [...CHART_PALETTE];

function parsePeriod(raw: string | undefined): HalfFilter {
  if (raw === "H1" || raw === "H2") return raw;
  return "ALL";
}

function expenseInHalf(date: Date, half: HalfFilter): boolean {
  if (half === "ALL") return true;
  const day = date.getDate();
  return half === "H1" ? day <= 15 : day >= 16;
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; category?: string; period?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;
  const categoryId = params.category || undefined;
  const period = parsePeriod(params.period);

  const [settings, categories, allCategories] = await Promise.all([
    getSettings(userId),
    getActiveCategories(userId),
    getAllCategories(userId),
  ]);
  const categoryOptions = allCategories.map((c) => ({
    id: c.id,
    name: c.name,
    archived: c.archived,
  }));
  const data = await getExpenses(
    userId,
    { year, month, categoryId },
    settings.reportingCurrency,
    settings.rates
  );

  const filteredExpenses = data.expenses.filter((e) => expenseInHalf(e.date, period));
  const completedFiltered = filteredExpenses.filter((e) => e.completed);
  const filteredTotalMinor = completedFiltered.reduce<number | null>((acc, e) => {
    if (e.convertedMinor === null) return null;
    if (acc === null) return null;
    return acc + e.convertedMinor;
  }, 0);
  const displayTotal =
    completedFiltered.some((e) => e.convertedMinor === null) ? null : filteredTotalMinor;

  const defaultDate = `${year}-${String(month).padStart(2, "0")}-${
    year === now.getFullYear() && month === now.getMonth() + 1
      ? String(now.getDate()).padStart(2, "0")
      : "01"
  }`;

  const byCategory = new Map<string, { name: string; total: number }>();
  for (const expense of data.expenses) {
    if (!expense.completed || expense.convertedMinor === null) continue;
    const existing = byCategory.get(expense.categoryId);
    if (existing) existing.total += expense.convertedMinor;
    else byCategory.set(expense.categoryId, { name: expense.categoryName, total: expense.convertedMinor });
  }
  const categorySegments = [...byCategory.entries()].map(([id, { name, total }], i) => ({
    key: id,
    name,
    value: total,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <ExpensesMonthFrame
        year={year}
        month={month}
        extraParams={{
          ...(categoryId ? { category: categoryId } : {}),
          ...(period !== "ALL" ? { period } : {}),
        }}
        title={<h1 className="page-title">Expenses</h1>}
        actions={<ExportPlanButton year={year} month={month} />}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <AddExpenseForm categories={categoryOptions} defaultDate={defaultDate} />
          <DonutChart
            title="Composition"
            subtitle="Spending by category this month"
            segments={categorySegments}
            currency={settings.reportingCurrency}
            centerLabel={
              data.totalMinor !== null
                ? formatMinor(data.totalMinor, settings.reportingCurrency)
                : "—"
            }
            centerSubLabel="Total spent"
            emptyMessage="No expenses this month."
          />
        </div>

        <ExpensesTable
          year={year}
          month={month}
          categoryId={categoryId}
          categories={categories}
          period={period}
          expenseCount={filteredExpenses.length}
          displayTotal={displayTotal}
          reportingCurrency={settings.reportingCurrency}
          usdToCrc={settings.rates.usdToCrc}
        >
          {filteredExpenses.length === 0 ? (
            <p className="py-3 text-sm text-ink-faint">
              {period === "ALL"
                ? "No expenses this month."
                : period === "H1"
                  ? "No expenses in the first half (1–15)."
                  : "No expenses in the second half (16–end)."}
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-neutral-800">
              {filteredExpenses.map((expense) => (
                <ExpenseListRow
                  key={expense.id}
                  expense={expense}
                  categories={categoryOptions}
                  reportingCurrency={settings.reportingCurrency}
                />
              ))}
            </ul>
          )}
        </ExpensesTable>
      </ExpensesMonthFrame>
    </div>
  );
}
