import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { unitService, UnitError } from "@/services/unit.service";

const conversionSchema = z.object({
  fromUnitId: z.string().min(1, "fromUnitId is required."),
  toUnitId: z.string().min(1, "toUnitId is required."),
  factor: z.number().positive("Factor must be greater than zero."),
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const conversions = await unitService.listConversions();
  return NextResponse.json({ conversions });
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

  const parsed = conversionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const conversion = await unitService.createConversion(parsed.data);
    return NextResponse.json({ conversion }, { status: 201 });
  } catch (err) {
    if (err instanceof UnitError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create unit conversion:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
