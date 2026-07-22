import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Ensure the Prisma schema is applied to the configured Postgres database
 * before unit tests that touch Prisma. Pure helpers (e.g. waterfall math) do
 * not require this, but shared globalSetup keeps one path for the suite.
 */
function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

export default function setup() {
  loadEnvFile();
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    throw new Error(
      "DATABASE_URL and DIRECT_URL must be set (see .env.example) for Prisma tests."
    );
  }
  if (process.env.DATABASE_URL.startsWith("file:")) {
    throw new Error(
      "SQLite is no longer supported; point DATABASE_URL at Supabase Postgres."
    );
  }
  execSync("npx prisma db push --accept-data-loss --skip-generate", {
    stdio: "inherit",
    env: process.env,
  });
}
