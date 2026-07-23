import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { brandService, BrandError } from "@/services/brand.service";

const brandSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
});

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  const brands = await brandService.list(includeInactive);
  return NextResponse.json({ brands });
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

  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const brand = await brandService.create(parsed.data);
    return NextResponse.json({ brand }, { status: 201 });
  } catch (err) {
    if (err instanceof BrandError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create brand:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
