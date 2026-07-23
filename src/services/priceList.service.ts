import { prisma } from "@/lib/prisma";

export class PriceListError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PriceListError";
  }
}

export interface PriceListInput {
  name: string;
  type?: string;
  branchId?: string | null;
  isDefault?: boolean;
}

export const priceListService = {
  async list(includeInactive = false) {
    return prisma.priceList.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    return prisma.priceList.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
  },

  async create(data: PriceListInput) {
    const existing = await prisma.priceList.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new PriceListError("A price list with this name already exists.");
    }

    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        // Only one default price list at a time.
        await tx.priceList.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
      }
      return tx.priceList.create({
        data: {
          name: data.name,
          type: data.type ?? "retail",
          branchId: data.branchId ?? null,
          isDefault: data.isDefault ?? false,
        },
      });
    });
  },

  async update(id: string, data: Partial<PriceListInput>) {
    const priceList = await prisma.priceList.findUnique({ where: { id } });
    if (!priceList) {
      throw new PriceListError("Price list not found.");
    }

    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.priceList.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
      }
      return tx.priceList.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.branchId !== undefined ? { branchId: data.branchId } : {}),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        },
      });
    });
  },

  async deactivate(id: string) {
    const priceList = await prisma.priceList.findUnique({ where: { id } });
    if (!priceList) {
      throw new PriceListError("Price list not found.");
    }
    return prisma.priceList.update({ where: { id }, data: { isActive: false, isDefault: false } });
  },

  async setItemPrice(priceListId: string, productId: string, price: number) {
    if (price < 0) {
      throw new PriceListError("Price can't be negative.");
    }
    const [priceList, product] = await Promise.all([
      prisma.priceList.findUnique({ where: { id: priceListId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);
    if (!priceList) throw new PriceListError("Price list not found.");
    if (!product) throw new PriceListError("Product not found.");

    const existing = await prisma.priceListItem.findUnique({
      where: { priceListId_productId: { priceListId, productId } },
    });

    if (existing) {
      return prisma.priceListItem.update({ where: { id: existing.id }, data: { price } });
    }
    return prisma.priceListItem.create({ data: { priceListId, productId, price } });
  },

  async removeItem(itemId: string) {
    const item = await prisma.priceListItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new PriceListError("Price list item not found.");
    }
    return prisma.priceListItem.delete({ where: { id: itemId } });
  },

  /** Resolves the effective price for a product: price-list override if one exists, else the product's own sellPrice. */
  async getEffectivePrice(priceListId: string, productId: string): Promise<number> {
    const item = await prisma.priceListItem.findUnique({
      where: { priceListId_productId: { priceListId, productId } },
    });
    if (item) return Number(item.price);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new PriceListError("Product not found.");
    return Number(product.sellPrice);
  },
};
