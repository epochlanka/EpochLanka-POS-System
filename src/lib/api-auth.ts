import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/services/auth.service";
import { SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * Resolves the current user from the session cookie, or returns a 401
 * response to short-circuit the route. Usage:
 *
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth;
 *   const { user } = auth;
 */
export async function requireUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionId ? await authService.getCurrentUser(sessionId) : null;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return { user };
}

/**
 * Like requireUser, but also checks the user's role has the given
 * permission key (e.g. "products.create"). Returns a 403 if not.
 */
export async function requirePermission(permission: string) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const allowed = await authService.hasPermission(auth.user.id, permission);
  if (!allowed) {
    return NextResponse.json(
      { error: "You do not have permission to perform this action." },
      { status: 403 }
    );
  }

  return auth;
}
