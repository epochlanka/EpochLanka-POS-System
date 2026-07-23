import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { productService, ProductError } from "@/services/product.service";
import { serializeDecimals } from "@/lib/serialize";

const stockSchema = z.object({
  warehouseId: z.string().min(1),
  quantity: z.number().int().min(0),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  sku: z.string().trim().min(1).optional(),
  barcode: z.string().trim().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  subCategoryId: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  baseUnitId: z.string().nullable().optional(),
  costPrice: z.number().min(0).optional(),
  sellPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  imageUrl: z.string().trim().nullable().optional(),
  stocks: z.array(stockSchema).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const product = await productService.getById(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ product: serializeDecimals(product) });
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
    const product = await productService.update(id, parsed.data, auth.user.id);
    return NextResponse.json({ product: serializeDecimals(product) });
  } catch (err) {
    if (err instanceof ProductError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to update product:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("products.delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await productService.deactivate(id, auth.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ProductError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to deactivate product:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
