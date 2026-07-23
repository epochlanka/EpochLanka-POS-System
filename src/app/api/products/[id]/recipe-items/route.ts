import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { recipeService, RecipeError } from "@/services/recipe.service";
import { serializeDecimals } from "@/lib/serialize";

const recipeItemSchema = z.object({
  ingredientProductId: z.string().min(1, "ingredientProductId is required."),
  quantity: z.number().positive("Quantity must be greater than zero."),
  unitId: z.string().nullable().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const items = await recipeService.listForProduct(id);
  const estimatedCost = await recipeService.estimateCost(id);
  return NextResponse.json({ items: serializeDecimals(items), estimatedCost });
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

  const parsed = recipeItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const item = await recipeService.addItem(id, parsed.data);
    return NextResponse.json({ item: serializeDecimals(item) }, { status: 201 });
  } catch (err) {
    if (err instanceof RecipeError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to add recipe item:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
