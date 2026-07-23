import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { priceListService, PriceListError } from "@/services/priceList.service";
import { serializeDecimals } from "@/lib/serialize";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  type: z.enum(["retail", "wholesale", "vip", "custom"]).optional(),
  branchId: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const priceList = await priceListService.getById(id);
  if (!priceList) {
    return NextResponse.json({ error: "Price list not found." }, { status: 404 });
  }
  return NextResponse.json({ priceList: serializeDecimals(priceList) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("products.edit");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const priceList = await priceListService.update(id, parsed.data);
    return NextResponse.json({ priceList });
  } catch (err) {
    if (err instanceof PriceListError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to update price list:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("products.delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await priceListService.deactivate(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof PriceListError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to deactivate price list:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
