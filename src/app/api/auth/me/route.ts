import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { authService } from "@/services/auth.service";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const permissions = await authService.getPermissions(auth.user.id);
  return NextResponse.json({ user: { ...auth.user, permissions } });
}
