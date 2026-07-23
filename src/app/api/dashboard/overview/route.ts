import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { dashboardService } from "@/services/dashboard.service";
import { serializeDecimals } from "@/lib/serialize";

export async function GET(request: NextRequest) {
  // Any authenticated user can view the overview — it's read-only, aggregate
  // data. Lock this down to a permission (e.g. "reports.view") if the
  // business wants cashiers/staff excluded from KPI numbers.
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const params = request.nextUrl.searchParams;
  const branchId = params.get("branchId") ?? auth.user.branchId ?? undefined;

  const overview = await dashboardService.getOverview({
    branchId: branchId ?? undefined,
  });

  return NextResponse.json(serializeDecimals(overview));
}
