import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { subCategoryService, SubCategoryError } from "@/services/subcategory.service";

const subCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  categoryId: z.string().min(1, "categoryId is required."),
});

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const categoryId = request.nextUrl.searchParams.get("categoryId") ?? undefined;
  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  const subCategories = await subCategoryService.list(categoryId, includeInactive);
  return NextResponse.json({ subCategories });
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

  const parsed = subCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const subCategory = await subCategoryService.create(parsed.data);
    return NextResponse.json({ subCategory }, { status: 201 });
  } catch (err) {
    if (err instanceof SubCategoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create sub-category:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
