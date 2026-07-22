import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { branchService } from "@/services/branch.service";

const branchSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  address: z.string().trim().nullable().optional(),
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const branches = await branchService.list();
  return NextResponse.json({ branches });
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

  const parsed = branchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const branch = await branchService.create(parsed.data);
  return NextResponse.json({ branch }, { status: 201 });
}
