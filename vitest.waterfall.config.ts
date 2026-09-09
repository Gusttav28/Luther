import { defineConfig } from "vitest/config";
import path from "node:path";

/** Pure unit tests — no Prisma / DB global setup. */
export default defineConfig({
  test: {
    include: [
      "tests/unit/waterfall.test.ts",
      "tests/unit/account-breakdown.test.ts",
      "tests/unit/main-cash.test.ts",
      "tests/unit/validation.test.ts",
    ],
    environment: "node",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
