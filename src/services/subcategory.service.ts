import { prisma } from "@/lib/prisma";

export class SubCategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubCategoryError";
  }
}

export interface SubCategoryInput {
  name: string;
  categoryId: string;
}

export const subCategoryService = {
  async list(categoryId?: string, includeInactive = false) {
    return prisma.subCategory.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: { category: true, _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    return prisma.subCategory.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  async create(data: SubCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new SubCategoryError("Parent category not found.");
    }

    const existing = await prisma.subCategory.findFirst({
      where: { categoryId: data.categoryId, name: { equals: data.name } },
    });
    if (existing) {
      throw new SubCategoryError("A sub-category with this name already exists in that category.");
    }

    return prisma.subCategory.create({
      data: { name: data.name, categoryId: data.categoryId },
    });
  },

  async update(id: string, data: Partial<SubCategoryInput>) {
    const subCategory = await prisma.subCategory.findUnique({ where: { id } });
    if (!subCategory) {
      throw new SubCategoryError("Sub-category not found.");
    }
    return prisma.subCategory.update({ where: { id }, data });
  },

  async deactivate(id: string) {
    const subCategory = await prisma.subCategory.findUnique({ where: { id } });
    if (!subCategory) {
      throw new SubCategoryError("Sub-category not found.");
    }
    return prisma.subCategory.update({ where: { id }, data: { isActive: false } });
  },

  async reactivate(id: string) {
    return prisma.subCategory.update({ where: { id }, data: { isActive: true } });
  },
};
