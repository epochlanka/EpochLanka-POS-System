import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { priceListService, PriceListError } from "@/services/priceList.service";

const priceListSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  type: z.enum(["retail", "wholesale", "vip", "custom"]).optional(),
  branchId: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  const priceLists = await priceListService.list(includeInactive);
  return NextResponse.json({ priceLists });
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

  const parsed = priceListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const priceList = await priceListService.create(parsed.data);
    return NextResponse.json({ priceList }, { status: 201 });
  } catch (err) {
    if (err instanceof PriceListError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create price list:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
