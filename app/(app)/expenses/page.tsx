import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { getExpenses, getActiveCategories } from "@/lib/queries/expenses";
import { Money, RatesNote } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { AddExpenseForm, ExpenseListRow } from "./expense-forms";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; category?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;
  const categoryId = params.category || undefined;

  const [settings, categories] = await Promise.all([
    getSettings(userId),
    getActiveCategories(userId),
  ]);
  const data = await getExpenses(
    userId,
    { year, month, categoryId },
    settings.reportingCurrency,
    settings.rates
  );

  const defaultDate = `${year}-${String(month).padStart(2, "0")}-${
    year === now.getFullYear() && month === now.getMonth() + 1
      ? String(now.getDate()).padStart(2, "0")
      : "01"
  }`;

  const filterUrl = (cat?: string) => {
    const p = new URLSearchParams({ year: String(year), month: String(month) });
    if (cat) p.set("category", cat);
    return `/expenses?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Expenses</h1>
        <MonthPicker
          year={year}
          month={month}
          basePath="/expenses"
          extraParams={categoryId ? { category: categoryId } : {}}
        />
      </div>

      <AddExpenseForm categories={categories} defaultDate={defaultDate} />

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={filterUrl()}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !categoryId ? "bg-brand-600 text-white" : "bg-white text-stone-600 border border-stone-300"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={filterUrl(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              categoryId === c.id
                ? "bg-brand-600 text-white"
                : "bg-white text-stone-600 border border-stone-300"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {data.expenses.length} expense{data.expenses.length === 1 ? "" : "s"}
          </h2>
          <p className="text-lg font-bold tabular-nums">
            <Money minor={data.totalMinor} currency={settings.reportingCurrency} />
          </p>
        </div>
        <RatesNote usdToCrc={settings.rates.usdToCrc} mxnToCrc={settings.rates.mxnToCrc} />
        {data.expenses.length === 0 ? (
          <p className="py-3 text-sm text-stone-400">No expenses this month.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {data.expenses.map((expense) => (
              <ExpenseListRow
                key={expense.id}
                expense={expense}
                categories={categories}
                reportingCurrency={settings.reportingCurrency}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
