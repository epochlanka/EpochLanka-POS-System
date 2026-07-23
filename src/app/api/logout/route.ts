import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/services/auth.service";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await authService.logoutUser(sessionId);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({ success: true });
}
