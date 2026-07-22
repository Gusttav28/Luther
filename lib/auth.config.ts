import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration shared by middleware and the server config.
 * Providers are attached in lib/auth.ts (they need Prisma/bcrypt, Node-only).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isLoginPage = request.nextUrl.pathname.startsWith("/login");
      const isSignOutPage = request.nextUrl.pathname.startsWith("/signout");
      // Always allow /login and /signout (route handler clears stale JWTs).
      if (isLoginPage || isSignOutPage) return true;
      return isLoggedIn; // false → redirect to signIn page
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
