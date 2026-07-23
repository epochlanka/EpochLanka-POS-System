import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { variantService, VariantError } from "@/services/variant.service";
import { serializeDecimals } from "@/lib/serialize";

const updateSchema = z.object({
  sku: z.string().trim().min(1).optional(),
  barcode: z.string().trim().nullable().optional(),
  sellPriceOverride: z.number().min(0).nullable().optional(),
  attributeValueIds: z.array(z.string().min(1)).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const auth = await requirePermission("products.edit");
  if (auth instanceof NextResponse) return auth;

  const { variantId } = await params;
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
    const variant = await variantService.update(variantId, parsed.data);
    return NextResponse.json({ variant: serializeDecimals(variant) });
  } catch (err) {
    if (err instanceof VariantError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to update variant:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const auth = await requirePermission("products.delete");
  if (auth instanceof NextResponse) return auth;

  const { variantId } = await params;
  try {
    await variantService.remove(variantId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof VariantError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to delete variant:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
