import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { productService, ProductError } from "@/services/product.service";
import { serializeDecimals } from "@/lib/serialize";

const stockSchema = z.object({
  warehouseId: z.string().min(1),
  quantity: z.number().int().min(0),
});

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  sku: z.string().trim().min(1, "SKU is required."),
  barcode: z.string().trim().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  subCategoryId: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  baseUnitId: z.string().nullable().optional(),
  costPrice: z.number().min(0, "Cost price can't be negative."),
  sellPrice: z.number().min(0, "Sell price can't be negative."),
  taxRate: z.number().min(0).max(100).optional(),
  imageUrl: z.string().trim().nullable().optional(),
  stocks: z.array(stockSchema).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const params = request.nextUrl.searchParams;
  const isActiveParam = params.get("isActive");

  const result = await productService.list({
    search: params.get("search") ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    subCategoryId: params.get("subCategoryId") ?? undefined,
    brandId: params.get("brandId") ?? undefined,
    isActive: isActiveParam === null ? undefined : isActiveParam === "true",
    page: params.get("page") ? Number(params.get("page")) : undefined,
    pageSize: params.get("pageSize") ? Number(params.get("pageSize")) : undefined,
  });

  return NextResponse.json(serializeDecimals(result));
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

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const product = await productService.create(parsed.data, auth.user.id);
    return NextResponse.json({ product: serializeDecimals(product) }, { status: 201 });
  } catch (err) {
    if (err instanceof ProductError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create product:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
