/**
 * Responsive checklist (R10 / TV5): every view must be usable at a phone
 * viewport (~360 px) with no horizontal page scroll. The plan matrix scrolls
 * horizontally inside its own container, which is allowed by the spec.
 */
import { test, expect, type Page } from "@playwright/test";

const VIEWS = [
  { path: "/", name: "overview" },
  { path: "/income", name: "income" },
  { path: "/expenses", name: "expenses" },
  { path: "/plan", name: "plan" },
  { path: "/savings", name: "savings" },
  { path: "/balance", name: "balance" },
  { path: "/projects", name: "projects" },
  { path: "/settings", name: "settings" },
] as const;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.OWNER_EMAIL ?? "");
  await page.getByLabel("Password").fill(process.env.OWNER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

test.describe("mobile 360px", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("login page fits a 360px viewport", async ({ page }) => {
    await page.goto("/login");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(360);
  });

  test("all app views fit a 360px viewport without horizontal page scroll", async ({ page }) => {
    await login(page);
    for (const view of VIEWS) {
      await page.goto(view.path);
      await page.waitForLoadState("networkidle");
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `${view.name} page should not scroll horizontally`).toBeLessThanOrEqual(
        360
      );
      // Bottom navigation must be present and visible on mobile.
      await expect(page.getByRole("link", { name: "Overview" }).last()).toBeVisible();
    }
  });
});

test.describe("desktop 1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("all app views render with the sidebar at desktop width", async ({ page }) => {
    await login(page);
    for (const view of VIEWS) {
      await page.goto(view.path);
      await expect(page.getByRole("link", { name: "Overview" }).first()).toBeVisible();
    }
  });
});
