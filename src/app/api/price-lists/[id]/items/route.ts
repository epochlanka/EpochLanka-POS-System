import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { priceListService, PriceListError } from "@/services/priceList.service";
import { serializeDecimals } from "@/lib/serialize";

const itemSchema = z.object({
  productId: z.string().min(1, "productId is required."),
  price: z.number().min(0, "Price can't be negative."),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("products.edit");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const item = await priceListService.setItemPrice(id, parsed.data.productId, parsed.data.price);
    return NextResponse.json({ item: serializeDecimals(item) }, { status: 201 });
  } catch (err) {
    if (err instanceof PriceListError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to set price list item:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
