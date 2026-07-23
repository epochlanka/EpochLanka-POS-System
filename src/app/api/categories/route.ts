import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { categoryService, CategoryError } from "@/services/category.service";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
});

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  const categories = await categoryService.list(includeInactive);
  return NextResponse.json({ categories });
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

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const category = await categoryService.create(parsed.data);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err instanceof CategoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create category:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
