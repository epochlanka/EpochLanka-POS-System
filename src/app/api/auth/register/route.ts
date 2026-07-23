import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { authService, AuthError } from "@/services/auth.service";

const registerSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : val),
    z.string().email("Enter a valid email address.")
  ),
  name: z.string().trim().min(1, "Name is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  roleId: z.string().min(1, "roleId is required."),
  branchId: z.string().nullable().optional(),
});

/**
 * Creating accounts is an admin action, not a public sign-up flow — this
 * POS has a fixed set of staff, provisioned by an Owner/Manager, not
 * self-service registration. Gated behind the "admin.access" permission.
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission("admin.access");
  if (auth instanceof NextResponse) return auth;

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
