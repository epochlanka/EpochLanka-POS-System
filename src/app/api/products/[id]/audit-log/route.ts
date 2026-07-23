import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { auditService } from "@/services/audit.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const entries = await auditService.listForEntity("Product", id);
  return NextResponse.json({ entries });
}
