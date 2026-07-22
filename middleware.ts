import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

// Route protection (R1, R2): everything except /login, auth API routes, and
// static assets requires a session; the `authorized` callback redirects.
export default NextAuth(authConfig).auth;

export const config = {
  // Public marks/favicons must bypass auth — otherwise sidebar & tab icons 307 to /login.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|icon(?:\\.png)?$|apple-icon|.*\\.(?:png|jpg|jpeg|gif|webp|ico|svg)$).*)",
  ],
};
