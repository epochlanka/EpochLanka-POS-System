import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { categoryService, CategoryError } from "@/services/category.service";

const updateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const category = await categoryService.getById(id);
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
  return NextResponse.json({ category });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("products.edit");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
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
    const category = await categoryService.update(id, parsed.data);
    return NextResponse.json({ category });
  } catch (err) {
    if (err instanceof CategoryError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to update category:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("products.delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await categoryService.deactivate(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof CategoryError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Failed to deactivate category:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
