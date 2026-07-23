import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { priceListService, PriceListError } from "@/services/priceList.service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requirePermission("products.edit");
  if (auth instanceof NextResponse) return auth;

  const { itemId } = await params;
  try {
    await priceListService.removeItem(itemId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof PriceListError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to remove price list item:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
