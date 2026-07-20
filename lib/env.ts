/**
 * Fail-fast environment assertions (R2): the app refuses to start without
 * its required configuration rather than running in an insecure state.
 */
const REQUIRED_RUNTIME_VARS = ["DATABASE_URL", "AUTH_SECRET"] as const;

export function assertRuntimeEnv(): void {
  const missing = REQUIRED_RUNTIME_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill in the values."
    );
  }
}

export function assertSeedEnv(): { email: string; password: string } {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Missing OWNER_EMAIL and/or OWNER_PASSWORD environment variables. " +
        "They are required to seed the owner account (see .env.example)."
    );
  }
  return { email, password };
}
