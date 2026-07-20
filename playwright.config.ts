import { defineConfig } from "@playwright/test";

// Make OWNER_EMAIL/OWNER_PASSWORD from .env available to the tests (Node 20.12+).
try {
  process.loadEnvFile(".env");
} catch {
  // .env optional — CI can provide real env vars instead.
}

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
