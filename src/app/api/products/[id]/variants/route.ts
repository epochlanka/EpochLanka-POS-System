import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { variantService, VariantError } from "@/services/variant.service";
import { serializeDecimals } from "@/lib/serialize";

const variantSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required."),
  barcode: z.string().trim().nullable().optional(),
  sellPriceOverride: z.number().min(0).nullable().optional(),
  attributeValueIds: z.array(z.string().min(1)).default([]),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const variants = await variantService.listForProduct(id);
  return NextResponse.json({ variants: serializeDecimals(variants) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("products.create");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const variant = await variantService.create(id, parsed.data);
    return NextResponse.json({ variant: serializeDecimals(variant) }, { status: 201 });
  } catch (err) {
    if (err instanceof VariantError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create variant:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
