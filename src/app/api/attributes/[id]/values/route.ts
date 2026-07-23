import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { attributeService, AttributeError } from "@/services/attribute.service";

const valueSchema = z.object({
  value: z.string().trim().min(1, "Value is required."),
});

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

  const parsed = valueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const attributeValue = await attributeService.addValue(id, parsed.data.value);
    return NextResponse.json({ attributeValue }, { status: 201 });
  } catch (err) {
    if (err instanceof AttributeError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to add attribute value:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
