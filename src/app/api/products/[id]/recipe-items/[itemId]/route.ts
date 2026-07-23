import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { recipeService, RecipeError } from "@/services/recipe.service";
import { serializeDecimals } from "@/lib/serialize";

const updateSchema = z.object({
  quantity: z.number().positive().optional(),
  unitId: z.string().nullable().optional(),
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
    const item = await recipeService.updateItem(itemId, parsed.data);
    return NextResponse.json({ item: serializeDecimals(item) });
  } catch (err) {
    if (err instanceof RecipeError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to update recipe item:", err);
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
    await recipeService.removeItem(itemId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof RecipeError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to remove recipe item:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
