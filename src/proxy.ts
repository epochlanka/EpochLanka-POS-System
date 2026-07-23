import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const PROTECTED_PREFIXES = ["/dashboard", "/pos", "/products", "/categories", "/attributes"];
const PROTECTED_PREFIXES = ["/dashboard", "/pos"];

/**
 * This proxy only does a cheap, cookie-presence check. It runs on the
 * Edge runtime, which can't talk to the SQLite/Postgres driver adapters used
 * by Prisma here — so it can't confirm the session is actually still valid.
 *
 * Real validation (does this session exist? has it expired? is the user
 * still active?) happens in `src/app/(dashboard)/layout.tsx`, which runs in
 * the Node runtime and queries the database. Treat this proxy as a fast
 * UX redirect, not the security boundary.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtectedRoute && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isLoginRoute = pathname.startsWith("/login");
  if (isLoginRoute && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pos/:path*",
    "/products/:path*",
    "/categories/:path*",
    "/attributes/:path*",
    "/login",
  ],
};
