import { prisma } from "@/lib/prisma";

export class ComboError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComboError";
  }
}

export const comboService = {
  async listItems(parentProductId: string) {
    return prisma.comboItem.findMany({
      where: { parentProductId },
      include: { childProduct: true },
      orderBy: { id: "asc" },
    });
  },

  async addItem(parentProductId: string, childProductId: string, quantity: number) {
    if (parentProductId === childProductId) {
      throw new ComboError("A product can't be a component of itself.");
    }
    if (quantity <= 0) {
      throw new ComboError("Quantity must be greater than zero.");
    }

    const [parent, child] = await Promise.all([
      prisma.product.findUnique({ where: { id: parentProductId } }),
      prisma.product.findUnique({ where: { id: childProductId } }),
    ]);
    if (!parent) throw new ComboError("Parent (bundle) product not found.");
    if (!child) throw new ComboError("Component product not found.");
    if (child.isCombo) {
      throw new ComboError("A bundle can't contain another bundle as a component.");
    }

    return prisma.$transaction(async (tx) => {
      const item = await tx.comboItem.create({
        data: { parentProductId, childProductId, quantity },
        include: { childProduct: true },
      });
      // Mark the parent as a combo product now that it has at least one component.
      await tx.product.update({ where: { id: parentProductId }, data: { isCombo: true } });
      return item;
    });
  },

  async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      throw new ComboError("Quantity must be greater than zero.");
    }
    const item = await prisma.comboItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new ComboError("Bundle component not found.");
    }
    return prisma.comboItem.update({ where: { id: itemId }, data: { quantity } });
  },

  async removeItem(itemId: string) {
    const item = await prisma.comboItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new ComboError("Bundle component not found.");
    }

    return prisma.$transaction(async (tx) => {
      await tx.comboItem.delete({ where: { id: itemId } });
      const remaining = await tx.comboItem.count({ where: { parentProductId: item.parentProductId } });
      if (remaining === 0) {
        await tx.product.update({ where: { id: item.parentProductId }, data: { isCombo: false } });
      }
    });
  },
};
