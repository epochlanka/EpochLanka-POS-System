import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { attributeService, AttributeError } from "@/services/attribute.service";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("products.delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await attributeService.removeValue(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AttributeError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to delete attribute value:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
