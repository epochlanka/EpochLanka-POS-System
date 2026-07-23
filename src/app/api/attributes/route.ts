import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { attributeService, AttributeError } from "@/services/attribute.service";

const attributeSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  values: z.array(z.string().trim().min(1)).optional(),
});

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const attributes = await attributeService.list();
  return NextResponse.json({ attributes });
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

  const parsed = attributeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const attribute = await attributeService.create(parsed.data.name, parsed.data.values ?? []);
    return NextResponse.json({ attribute }, { status: 201 });
  } catch (err) {
    if (err instanceof AttributeError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create attribute:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
