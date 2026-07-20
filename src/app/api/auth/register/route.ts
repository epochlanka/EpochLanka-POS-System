import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { authService, AuthError } from "@/services/auth.service";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const registerSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : val),
    z.email("Enter a valid email address.")
  ),
  name: z.string().trim().min(1, "Name is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  roleId: z.string().min(1, "roleId is required."),
  branchId: z.string().nullable().optional(),
});

/**
 * Creating accounts is an admin action, not a public sign-up flow — this
 * POS has a fixed set of staff, provisioned by an Owner/Manager, not
 * self-service registration. Gate it behind the caller's own session and
 * the "admin.access" permission on their role.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = sessionId ? await authService.getCurrentUser(sessionId) : null;

  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const canCreateUsers = await authService.hasPermission(currentUser.id, "admin.access");
  if (!canCreateUsers) {
    return NextResponse.json(
      { error: "You do not have permission to create accounts." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const newUser = await authService.registerUser(parsed.data);
    const { passwordHash, ...safeUser } = newUser;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Registration failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
