/**
 * E2E smoke (TV2): logged-out redirect, login, create income / expense /
 * category / project / savings contribution, logout. Covers R1, R3, R4, R6,
 * R9, R12. Runs against the dev server with the seeded owner account.
 */
import { test, expect, type Page } from "@playwright/test";

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD ?? "";

test.beforeAll(() => {
  if (!OWNER_EMAIL || !OWNER_PASSWORD) {
    throw new Error("OWNER_EMAIL and OWNER_PASSWORD must be set (see .env.example)");
  }
});

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(OWNER_EMAIL);
  await page.getByLabel("Password").fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible({
    timeout: 15_000,
  });
}

test.describe.configure({ mode: "serial" });

test("logged-out access to a protected route redirects to /login (R1)", async ({ page }) => {
  await page.goto("/expenses");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("wrong credentials show a generic error (R1)", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(OWNER_EMAIL);
  await page.getByLabel("Password").fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});

test("login, use each module, and logout", async ({ page }) => {
  await login(page);
  const stamp = Date.now();
  const incomeLabel = `e2e salary ${stamp}`;
  const categoryName = `E2E Category ${stamp}`;
  const expenseName = `e2e expense ${stamp}`;
  const savingsNote = `e2e savings ${stamp}`;
  const projectName = `E2E Project ${stamp}`;

  // Income (R3)
  await page.goto("/income");
  await page.getByLabel("Amount").fill("1500");
  await page.getByLabel("Period").selectOption("H1");
  await page.getByLabel("Label (optional)").fill(incomeLabel);
  await page.getByRole("button", { name: "Add income" }).click();
  await expect(page.getByText(incomeLabel)).toBeVisible();

  // Category (R6)
  await page.goto("/plan");
  await page.getByLabel("New category").fill(categoryName);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("rowheader", { name: categoryName })).toBeVisible();

  // Expense (R4)
  await page.goto("/expenses");
  await page.getByLabel("Expense name").fill(expenseName);
  await page.getByLabel("Amount").fill("42.50");
  await page.getByRole("combobox", { name: "Category" }).fill(categoryName);
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(page.getByText(expenseName)).toBeVisible();

  // Savings contribution (R12)
  await page.goto("/savings");
  await page.getByLabel("Amount").fill("100");
  await page.getByLabel("Currency").selectOption("CRC");
  await page.getByLabel("Note (optional)").fill(savingsNote);
  await page.getByRole("button", { name: "Record" }).click();
  await expect(page.getByText(savingsNote)).toBeVisible();

  // Project (R9)
  await page.goto("/projects");
  await page.getByLabel("Name").fill(projectName);
  await page.getByLabel("Cost").fill("999.99");
  await page.getByRole("button", { name: "Add project" }).click();
  await expect(page.getByText(projectName)).toBeVisible();

  // Logout (R1) — force avoids the Next.js dev indicator overlaying the sidebar control
  await page.getByRole("button", { name: "Sign out" }).first().click({ force: true });
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});
