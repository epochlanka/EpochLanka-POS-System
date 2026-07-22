import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { unitService, UnitError } from "@/services/unit.service";

const unitSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  symbol: z.string().trim().min(1, "Symbol is required."),
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const units = await unitService.list();
  return NextResponse.json({ units });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission("products.create");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = unitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const unit = await unitService.create(parsed.data);
    return NextResponse.json({ unit }, { status: 201 });
  } catch (err) {
    if (err instanceof UnitError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create unit:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
