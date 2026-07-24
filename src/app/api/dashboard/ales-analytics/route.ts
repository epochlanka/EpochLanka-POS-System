import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { salesAnalyticsService } from "@/services/salesAnalytics.service";
import { serializeDecimals } from "@/lib/serialize";

export async function GET(request: NextRequest) {
  // Read-only aggregate data — same reasoning as /api/dashboard/overview:
  // any authenticated user can view it unless the business wants it locked
  // down to a permission like "reports.view".
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const params = request.nextUrl.searchParams;
  const branchId = params.get("branchId") ?? auth.user.branchId ?? undefined;
  const days = params.get("days") ? Number(params.get("days")) : undefined;

  const analytics = await salesAnalyticsService.getAnalytics({
    branchId: branchId ?? undefined,
    days: days && days > 0 && days <= 90 ? days : undefined,
  });

  return NextResponse.json(serializeDecimals(analytics));
}