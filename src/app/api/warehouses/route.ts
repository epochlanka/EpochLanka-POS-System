import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { warehouseService } from "@/services/branch.service";

const warehouseSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  branchId: z.string().trim().nullable().optional(),
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const warehouses = await warehouseService.list();
  return NextResponse.json({ warehouses });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission("admin.access");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = warehouseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const warehouse = await warehouseService.create(parsed.data);
  return NextResponse.json({ warehouse }, { status: 201 });
}
