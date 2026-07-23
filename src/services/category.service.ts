import { prisma } from "@/lib/prisma";

export class CategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategoryError";
  }
}

export interface CategoryInput {
  name: string;
}

export const categoryService = {
  async list(includeInactive = false) {
    return prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { subCategories: true, _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { subCategories: true },
    });
  },

  async create(data: CategoryInput) {
    const existing = await prisma.category.findFirst({
      where: { name: { equals: data.name } },
    });
    if (existing) {
      throw new CategoryError("A category with this name already exists.");
    }
    return prisma.category.create({ data: { name: data.name } });
  },

  async update(id: string, data: Partial<CategoryInput>) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new CategoryError("Category not found.");
    }
    return prisma.category.update({ where: { id }, data });
  },

  /** Soft delete: keeps historical products intact and simply hides the category from pickers. */
  async deactivate(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new CategoryError("Category not found.");
    }
    return prisma.category.update({ where: { id }, data: { isActive: false } });
  },

  async reactivate(id: string) {
    return prisma.category.update({ where: { id }, data: { isActive: true } });
  },
};
