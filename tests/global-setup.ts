import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

/**
 * Create a fresh SQLite test database (prisma/test.db) before the suite runs.
 * The throwaway file is removed and the committed migrations are applied —
 * the development database (dev.db) is never touched.
 */
export default function setup() {
  const testDb = path.join(__dirname, "..", "prisma", "test.db");
  for (const suffix of ["", "-journal"]) {
    rmSync(`${testDb}${suffix}`, { force: true });
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
