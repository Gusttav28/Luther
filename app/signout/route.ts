import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

/** Clears Auth.js session cookies, then sends the browser to /login. */
export async function GET(request: Request) {
  await signOut({ redirect: false });
  const response = NextResponse.redirect(new URL("/login", request.url));
  // Help the browser drop the session cache marker via a short-lived hint cookie.
  response.cookies.set("luther-cache-bust", String(Date.now()), { path: "/", maxAge: 10 });
  return response;
}
