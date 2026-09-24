import { defineConfig } from "vitest/config";
import path from "node:path";

/** Pure unit tests — no Prisma / DB global setup. */
export default defineConfig({
  test: {
    include: [
      "tests/unit/waterfall.test.ts",
      "tests/unit/category-tree.test.ts",
      "tests/unit/category-spend.test.ts",
      "tests/unit/plan-groups.test.ts",
      "tests/unit/project-covered.test.ts",
      "tests/unit/projections.test.ts",
      "tests/unit/account-breakdown.test.ts",
      "tests/unit/balance-months.test.ts",
      "tests/unit/main-cash.test.ts",
      "tests/unit/overview-dashboard.test.ts",
      "tests/unit/validation.test.ts",
    ],
    environment: "node",
    env: {
      AUTH_SECRET: "test-secret-not-used-in-production",
    },
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
