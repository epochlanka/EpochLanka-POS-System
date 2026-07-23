import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { comboService, ComboError } from "@/services/combo.service";

const updateSchema = z.object({
  quantity: z.number().positive("Quantity must be greater than zero."),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requirePermission("products.edit");
  if (auth instanceof NextResponse) return auth;

  const { itemId } = await params;
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
    const item = await comboService.updateItemQuantity(itemId, parsed.data.quantity);
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof ComboError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to update bundle component:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requirePermission("products.delete");
  if (auth instanceof NextResponse) return auth;

  const { itemId } = await params;
  try {
    await comboService.removeItem(itemId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ComboError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to remove bundle component:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
