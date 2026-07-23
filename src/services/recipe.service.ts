import { prisma } from "@/lib/prisma";

export class RecipeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecipeError";
  }
}

export interface RecipeItemInput {
  ingredientProductId: string;
  quantity: number;
  unitId?: string | null;
}

const RECIPE_ITEM_INCLUDE = {
  ingredientProduct: true,
  unit: true,
} as const;

export const recipeService = {
  async listForProduct(finishedProductId: string) {
    return prisma.recipeItem.findMany({
      where: { finishedProductId },
      include: RECIPE_ITEM_INCLUDE,
      orderBy: { id: "asc" },
    });
  },

  async addItem(finishedProductId: string, data: RecipeItemInput) {
    if (finishedProductId === data.ingredientProductId) {
      throw new RecipeError("A product can't be an ingredient of itself.");
    }
    if (data.quantity <= 0) {
      throw new RecipeError("Quantity must be greater than zero.");
    }

    const [finished, ingredient] = await Promise.all([
      prisma.product.findUnique({ where: { id: finishedProductId } }),
      prisma.product.findUnique({ where: { id: data.ingredientProductId } }),
    ]);
    if (!finished) throw new RecipeError("Finished product not found.");
    if (!ingredient) throw new RecipeError("Ingredient product not found.");

    if (data.unitId) {
      const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
      if (!unit) throw new RecipeError("Unit not found.");
    }

    const existing = await prisma.recipeItem.findFirst({
      where: { finishedProductId, ingredientProductId: data.ingredientProductId },
    });
    if (existing) {
      throw new RecipeError("This ingredient is already part of the recipe. Update its quantity instead.");
    }

    return prisma.recipeItem.create({
      data: {
        finishedProductId,
        ingredientProductId: data.ingredientProductId,
        quantity: data.quantity,
        unitId: data.unitId ?? null,
      },
      include: RECIPE_ITEM_INCLUDE,
    });
  },

  async updateItem(itemId: string, data: Partial<Pick<RecipeItemInput, "quantity" | "unitId">>) {
    const item = await prisma.recipeItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new RecipeError("Recipe item not found.");
    }
    if (data.quantity !== undefined && data.quantity <= 0) {
      throw new RecipeError("Quantity must be greater than zero.");
    }
    if (data.unitId) {
      const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
      if (!unit) throw new RecipeError("Unit not found.");
    }

    return prisma.recipeItem.update({
      where: { id: itemId },
      data: {
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.unitId !== undefined ? { unitId: data.unitId } : {}),
      },
      include: RECIPE_ITEM_INCLUDE,
    });
  },

  async removeItem(itemId: string) {
    const item = await prisma.recipeItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new RecipeError("Recipe item not found.");
    }
    return prisma.recipeItem.delete({ where: { id: itemId } });
  },

  /**
   * Estimated cost to produce one unit of the finished product, based on the
   * ingredients' current costPrice. Useful for margin checks before a
   * production-order feature exists to actually consume stock.
   */
  async estimateCost(finishedProductId: string): Promise<number> {
    const items = await prisma.recipeItem.findMany({
      where: { finishedProductId },
      include: { ingredientProduct: true },
    });
    return items.reduce((sum, item) => sum + item.quantity * Number(item.ingredientProduct.costPrice), 0);
  },
};
