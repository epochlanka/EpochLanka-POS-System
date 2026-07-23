import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { comboService, ComboError } from "@/services/combo.service";
import { serializeDecimals } from "@/lib/serialize";

const comboItemSchema = z.object({
  childProductId: z.string().min(1, "childProductId is required."),
  quantity: z.number().positive("Quantity must be greater than zero."),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const items = await comboService.listItems(id);
  return NextResponse.json({ items: serializeDecimals(items) });
}

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

  const parsed = comboItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const item = await comboService.addItem(id, parsed.data.childProductId, parsed.data.quantity);
    return NextResponse.json({ item: serializeDecimals(item) }, { status: 201 });
  } catch (err) {
    if (err instanceof ComboError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to add bundle component:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
