import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getExpenses, getActiveCategories, getAllCategories } from "@/lib/queries/expenses";
import { formatMinor } from "@/lib/money";
import { DonutChart } from "@/components/charts/donut-chart";
import { AddExpenseForm, ExpenseListRow } from "./expense-forms";
import { ExpensesTable, type HalfFilter } from "./expenses-table";
import { ExportPlanButton } from "./export-plan-button";
import { ExpensesMonthFrame } from "./expenses-month-frame";
import { RegisterAddExpenseForm } from "@/components/add-expense-sheet";
import { CHART_PALETTE } from "@/lib/chart-colors";
import { findCategory, rollupSpendToParents } from "@/lib/category-tree";

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
  searchParams: Promise<{
    year?: string;
    month?: string;
    category?: string;
    period?: string;
    add?: string;
  }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;
  const categoryId = params.category || undefined;
  const period = parsePeriod(params.period);
  const openFromQuery = params.add === "1";

  const [settings, categories, allCategories] = await Promise.all([
    getSettings(userId),
    getActiveCategories(userId),
    getAllCategories(userId),
  ]);
  const categoryOptions = allCategories.map((c) => ({
    id: c.id,
    name: c.name,
    archived: c.archived,
    parentId: c.parentId,
  }));
  const categoryNodes = allCategories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
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

  function sumConverted(
    rows: typeof filteredExpenses
  ): number | null {
    let total: number | null = 0;
    for (const row of rows) {
      if (row.convertedMinor === null) return null;
      if (total !== null) total += row.convertedMinor;
    }
    return total;
  }

  const displayTotal = sumConverted(completedFiltered);
  const trackedTotalMinor = sumConverted(filteredExpenses);

  const defaultDate = `${year}-${String(month).padStart(2, "0")}-${
    year === now.getFullYear() && month === now.getMonth() + 1
      ? String(now.getDate()).padStart(2, "0")
      : "01"
  }`;

  const completedForDonut = data.expenses.filter(
    (expense) => expense.completed && expense.convertedMinor !== null
  );
  const selectedCategory = findCategory(categoryNodes, categoryId);
  const donutRows = completedForDonut.map((expense) => ({
    categoryId: expense.categoryId,
    amountMinor: expense.convertedMinor as number,
  }));
  const rolled =
    !categoryId || !selectedCategory?.parentId
      ? selectedCategory && !selectedCategory.parentId
        ? donutRows.reduce<Array<{ categoryId: string; name: string; amountMinor: number }>>(
            (acc, row) => {
              const node = findCategory(categoryNodes, row.categoryId);
              const name = node?.parentId ? node.name : `${selectedCategory.name} (general)`;
              const existing = acc.find((item) => item.categoryId === row.categoryId);
              if (existing) existing.amountMinor += row.amountMinor;
              else acc.push({ categoryId: row.categoryId, name, amountMinor: row.amountMinor });
              return acc;
            },
            []
          )
        : rollupSpendToParents(donutRows, categoryNodes)
      : donutRows.map((row) => ({
          categoryId: row.categoryId,
          name: selectedCategory.name,
          amountMinor: row.amountMinor,
        }));
  const categorySegments = rolled.map((item, i) => ({
    key: item.categoryId,
    name: item.name,
    value: item.amountMinor,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const list = (
    <ExpensesTable
      year={year}
      month={month}
      categoryId={categoryId}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        archived: c.archived,
        parentId: c.parentId,
      }))}
      period={period}
      expenseCount={filteredExpenses.length}
      displayTotal={displayTotal}
      trackedTotalMinor={trackedTotalMinor}
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
  );

  return (
    <div className="mx-auto max-w-5xl">
      <RegisterAddExpenseForm
        categories={categoryOptions}
        defaultDate={defaultDate}
        openFromQuery={openFromQuery}
      />

      <ExpensesMonthFrame
        year={year}
        month={month}
        extraParams={{
          ...(categoryId ? { category: categoryId } : {}),
          ...(period !== "ALL" ? { period } : {}),
        }}
        title={<h1 className="page-title md:text-2xl">Expenses</h1>}
        actions={<ExportPlanButton year={year} month={month} />}
      >
        {/* Desktop: inline add + donut */}
        <div className="hidden gap-4 md:grid lg:grid-cols-2">
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

        {list}
      </ExpensesMonthFrame>
    </div>
  );
}
