import { prisma } from "@/lib/prisma";

export class VariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VariantError";
  }
}

export interface VariantInput {
  sku: string;
  barcode?: string | null;
  sellPriceOverride?: number | null;
  attributeValueIds: string[];
}

const VARIANT_INCLUDE = {
  attributes: { include: { attributeValue: { include: { attribute: true } } } },
} as const;

export const variantService = {
  async listForProduct(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
      include: VARIANT_INCLUDE,
      orderBy: { sku: "asc" },
    });
  },

  async create(productId: string, data: VariantInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new VariantError("Product not found.");
    }

    const existingSku = await prisma.productVariant.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      throw new VariantError("A variant with this SKU already exists.");
    }
    if (data.barcode) {
      const existingBarcode = await prisma.productVariant.findUnique({ where: { barcode: data.barcode } });
      if (existingBarcode) {
        throw new VariantError("A variant with this barcode already exists.");
      }
    }

    if (data.attributeValueIds.length > 0) {
      const foundValues = await prisma.attributeValue.findMany({
        where: { id: { in: data.attributeValueIds } },
      });
      if (foundValues.length !== data.attributeValueIds.length) {
        throw new VariantError("One or more attribute values were not found.");
      }
    }

    return prisma.productVariant.create({
      data: {
        productId,
        sku: data.sku,
        barcode: data.barcode ?? null,
        sellPriceOverride: data.sellPriceOverride ?? null,
        attributes: {
          create: data.attributeValueIds.map((attributeValueId) => ({ attributeValueId })),
        },
      },
      include: VARIANT_INCLUDE,
    });
  },

  async update(variantId: string, data: Partial<VariantInput>) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new VariantError("Variant not found.");
    }

    if (data.sku && data.sku !== variant.sku) {
      const existingSku = await prisma.productVariant.findUnique({ where: { sku: data.sku } });
      if (existingSku) {
        throw new VariantError("A variant with this SKU already exists.");
      }
    }
    if (data.barcode && data.barcode !== variant.barcode) {
      const existingBarcode = await prisma.productVariant.findUnique({ where: { barcode: data.barcode } });
      if (existingBarcode) {
        throw new VariantError("A variant with this barcode already exists.");
      }
    }

    return prisma.$transaction(async (tx) => {
      if (data.attributeValueIds) {
        await tx.productVariantAttribute.deleteMany({ where: { variantId } });
        await tx.productVariantAttribute.createMany({
          data: data.attributeValueIds.map((attributeValueId) => ({ variantId, attributeValueId })),
        });
      }

      return tx.productVariant.update({
        where: { id: variantId },
        data: {
          ...(data.sku !== undefined ? { sku: data.sku } : {}),
          ...(data.barcode !== undefined ? { barcode: data.barcode } : {}),
          ...(data.sellPriceOverride !== undefined ? { sellPriceOverride: data.sellPriceOverride } : {}),
        },
        include: VARIANT_INCLUDE,
      });
    });
  },

  /** Hard delete — variants have no historical dependency of their own (sales reference the parent product). */
  async remove(variantId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new VariantError("Variant not found.");
    }
    return prisma.productVariant.delete({ where: { id: variantId } });
  },

  async deactivate(variantId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new VariantError("Variant not found.");
    }
    return prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
  },
};
