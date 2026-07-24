import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { unitService, UnitError } from "@/services/unit.service";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("products.delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await unitService.removeConversion(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof UnitError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to delete unit conversion:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
