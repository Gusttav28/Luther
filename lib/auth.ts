import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { loginSchema } from "./validation";

/**
 * Simple in-memory login throttle (R1): after repeated failures for the same
 * email, require a cool-down before trying again. Sufficient for a solo,
 * single-instance MVP.
 */
const failures = new Map<string, { count: number; lastAt: number }>();
const MAX_FAILURES = 5;
const COOLDOWN_MS = 60_000;

function isThrottled(email: string): boolean {
  const entry = failures.get(email);
  if (!entry) return false;
  if (Date.now() - entry.lastAt > COOLDOWN_MS) {
    failures.delete(email);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(email: string): void {
  const entry = failures.get(email);
  failures.set(email, {
    count: (entry?.count ?? 0) + 1,
    lastAt: Date.now(),
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        if (isThrottled(email)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Compare against a dummy hash when the user doesn't exist to keep
        // timing uniform (no user enumeration).
        const hash =
          user?.passwordHash ??
          "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpQ1S1XhGvsTQCyF1yCu3q3q3q3q3";
        const valid = await bcrypt.compare(password, hash);
        if (!user || !valid) {
          recordFailure(email);
          return null;
        }
        failures.delete(email);
        return { id: user.id, email: user.email };
      },
    }),
  ],
});

/** The authenticated owner's user id; throws if there is no session. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
