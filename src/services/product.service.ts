import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auditService, diffFields } from "@/services/audit.service";

export class ProductError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductError";
  }
}

export interface StockInput {
  warehouseId: string;
  quantity: number;
}

export interface ProductInput {
  name: string;
  sku: string;
  barcode?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  baseUnitId?: string | null;
  costPrice: number;
  sellPrice: number;
  taxRate?: number;
  imageUrl?: string | null;
  /** Initial (or updated) on-hand quantity per warehouse/branch. */
  stocks?: StockInput[];
}

export interface ListProductsParams {
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

const PRODUCT_INCLUDE = {
  category: true,
  subCategory: true,
  brand: true,
  baseUnit: true,
  stocks: { include: { warehouse: { include: { branch: true } } } },
} satisfies Prisma.ProductInclude;

async function assertCategoryHierarchy(categoryId?: string | null, subCategoryId?: string | null) {
  if (subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({ where: { id: subCategoryId } });
    if (!subCategory) {
      throw new ProductError("Sub-category not found.");
    }
    if (categoryId && subCategory.categoryId !== categoryId) {
      throw new ProductError("Sub-category does not belong to the selected category.");
    }
  }
}

/** Creates or overwrites a product's stock row for a given warehouse (no batch tracking — that's a separate flow). */
async function setWarehouseStock(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string,
  quantity: number
) {
  const existing = await tx.stock.findFirst({
    where: { productId, warehouseId, batchNumber: null },
  });

  if (existing) {
    return tx.stock.update({ where: { id: existing.id }, data: { quantity } });
  }
  return tx.stock.create({ data: { productId, warehouseId, quantity } });
}

export const productService = {
  async list(params: ListProductsParams) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

    const where: Prisma.ProductWhereInput = {
      ...(params.isActive === undefined ? {} : { isActive: params.isActive }),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.subCategoryId ? { subCategoryId: params.subCategoryId } : {}),
      ...(params.brandId ? { brandId: params.brandId } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search } },
              { sku: { contains: params.search } },
              { barcode: { contains: params.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    const itemsWithTotals = items.map((product) => ({
      ...product,
      totalStock: product.stocks.reduce((sum, s) => sum + s.quantity, 0),
    }));

    return { items: itemsWithTotals, total, page, pageSize };
  },

  async getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        ...PRODUCT_INCLUDE,
        variants: { include: { attributes: { include: { attributeValue: { include: { attribute: true } } } } } },
      },
    });
  },

  async create(data: ProductInput, actorUserId?: string) {
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      throw new ProductError("A product with this SKU already exists.");
    }
    if (data.barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: data.barcode } });
      if (existingBarcode) {
        throw new ProductError("A product with this barcode already exists.");
      }
    }
    await assertCategoryHierarchy(data.categoryId, data.subCategoryId);

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          barcode: data.barcode ?? null,
          categoryId: data.categoryId ?? null,
          subCategoryId: data.subCategoryId ?? null,
          brandId: data.brandId ?? null,
          baseUnitId: data.baseUnitId ?? null,
          costPrice: data.costPrice,
          sellPrice: data.sellPrice,
          taxRate: data.taxRate ?? 0,
          imageUrl: data.imageUrl ?? null,
        },
      });

      if (data.stocks && data.stocks.length > 0) {
        for (const stock of data.stocks) {
          await setWarehouseStock(tx, product.id, stock.warehouseId, stock.quantity);
        }
      }

      return tx.product.findUniqueOrThrow({ where: { id: product.id }, include: PRODUCT_INCLUDE });
    });

    if (actorUserId) {
      await auditService
        .log(actorUserId, "create", "Product", result.id, { name: result.name, sku: result.sku })
        .catch((err) => console.error("Failed to write audit log:", err));
    }

    return result;
  },

  async update(id: string, data: Partial<ProductInput>, actorUserId?: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new ProductError("Product not found.");
    }

    if (data.sku && data.sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) {
        throw new ProductError("A product with this SKU already exists.");
      }
    }
    if (data.barcode && data.barcode !== product.barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: data.barcode } });
      if (existingBarcode) {
        throw new ProductError("A product with this barcode already exists.");
      }
    }

    await assertCategoryHierarchy(
      data.categoryId !== undefined ? data.categoryId : product.categoryId,
      data.subCategoryId !== undefined ? data.subCategoryId : product.subCategoryId
    );

    const { stocks, ...fieldChanges } = data;
    const changes = diffFields(product, fieldChanges);

    const result = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.sku !== undefined ? { sku: data.sku } : {}),
          ...(data.barcode !== undefined ? { barcode: data.barcode } : {}),
          ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
          ...(data.subCategoryId !== undefined ? { subCategoryId: data.subCategoryId } : {}),
          ...(data.brandId !== undefined ? { brandId: data.brandId } : {}),
          ...(data.baseUnitId !== undefined ? { baseUnitId: data.baseUnitId } : {}),
          ...(data.costPrice !== undefined ? { costPrice: data.costPrice } : {}),
          ...(data.sellPrice !== undefined ? { sellPrice: data.sellPrice } : {}),
          ...(data.taxRate !== undefined ? { taxRate: data.taxRate } : {}),
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        },
      });

      if (data.stocks && data.stocks.length > 0) {
        for (const stock of data.stocks) {
          await setWarehouseStock(tx, id, stock.warehouseId, stock.quantity);
        }
      }

      return tx.product.findUniqueOrThrow({ where: { id }, include: PRODUCT_INCLUDE });
    });

    if (actorUserId && Object.keys(changes).length > 0) {
      await auditService
        .log(actorUserId, "update", "Product", id, changes)
        .catch((err) => console.error("Failed to write audit log:", err));
    }

    return result;
  },

  /** Soft delete — products stay attached to historical sales/stock records. */
  async deactivate(id: string, actorUserId?: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new ProductError("Product not found.");
    }
    const result = await prisma.product.update({ where: { id }, data: { isActive: false } });
    if (actorUserId) {
      await auditService
        .log(actorUserId, "deactivate", "Product", id, { name: product.name, sku: product.sku })
        .catch((err) => console.error("Failed to write audit log:", err));
    }
    return result;
  },

  async reactivate(id: string, actorUserId?: string) {
    const result = await prisma.product.update({ where: { id }, data: { isActive: true } });
    if (actorUserId) {
      await auditService
        .log(actorUserId, "reactivate", "Product", id, {})
        .catch((err) => console.error("Failed to write audit log:", err));
    }
    return result;
  },
};
