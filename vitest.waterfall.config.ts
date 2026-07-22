import { defineConfig } from "vitest/config";
import path from "node:path";

/** Pure unit tests — no Prisma / DB global setup. */
export default defineConfig({
  test: {
    include: ["tests/unit/waterfall.test.ts"],
    environment: "node",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
