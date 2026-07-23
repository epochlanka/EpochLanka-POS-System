import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { productService } from "@/services/product.service";
import { auditService } from "@/services/audit.service";

const CSV_HEADER = [
  "name",
  "sku",
  "barcode",
  "category",
  "subCategory",
  "brand",
  "baseUnit",
  "costPrice",
  "sellPrice",
  "taxRate",
  "isActive",
];

export interface ImportRowResult {
  row: number;
  sku: string;
  status: "created" | "updated" | "error";
  message?: string;
}

export interface ImportSummary {
  created: number;
  updated: number;
  errors: number;
  results: ImportRowResult[];
}

async function resolveCategoryId(name: string | undefined): Promise<string | null> {
  if (!name) return null;
  const existing = await prisma.category.findFirst({ where: { name: { equals: name } } });
  if (existing) return existing.id;
  const created = await prisma.category.create({ data: { name } });
  return created.id;
}

async function resolveSubCategoryId(name: string | undefined, categoryId: string | null): Promise<string | null> {
  if (!name || !categoryId) return null;
  const existing = await prisma.subCategory.findFirst({ where: { name: { equals: name }, categoryId } });
  if (existing) return existing.id;
  const created = await prisma.subCategory.create({ data: { name, categoryId } });
  return created.id;
}

async function resolveBrandId(name: string | undefined): Promise<string | null> {
  if (!name) return null;
  const existing = await prisma.brand.findFirst({ where: { name: { equals: name } } });
  if (existing) return existing.id;
  const created = await prisma.brand.create({ data: { name } });
  return created.id;
}

async function resolveUnitId(name: string | undefined): Promise<string | null> {
  if (!name) return null;
  const existing = await prisma.unit.findFirst({ where: { name: { equals: name } } });
  if (existing) return existing.id;
  // We don't know the symbol from a bare unit name in the CSV — use the name itself as a placeholder;
  // it can be corrected later from the Units screen.
  const created = await prisma.unit.create({ data: { name, symbol: name.slice(0, 3).toLowerCase() } });
  return created.id;
}

export const productBulkService = {
  async exportToCsv(): Promise<string> {
    const products = await prisma.product.findMany({
      include: { category: true, subCategory: true, brand: true, baseUnit: true },
      orderBy: { name: "asc" },
    });

    const rows = products.map((p) => [
      p.name,
      p.sku,
      p.barcode ?? "",
      p.category?.name ?? "",
      p.subCategory?.name ?? "",
      p.brand?.name ?? "",
      p.baseUnit?.name ?? "",
      Number(p.costPrice),
      Number(p.sellPrice),
      p.taxRate,
      p.isActive ? "true" : "false",
    ]);

    return toCsv(CSV_HEADER, rows);
  },

  /**
   * Imports rows already parsed into objects keyed by the CSV_HEADER column
   * names. Each row is processed independently — one bad row doesn't abort
   * the rest of the batch.
   */
  async importRows(rows: Record<string, string>[], actorUserId?: string): Promise<ImportSummary> {
    const results: ImportRowResult[] = [];
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +1 for 1-indexing, +1 for the header row
      const row = rows[i];
      const sku = row.sku?.trim();

      try {
        if (!row.name?.trim()) throw new Error("Missing 'name'.");
        if (!sku) throw new Error("Missing 'sku'.");

        const costPrice = Number(row.costPrice);
        const sellPrice = Number(row.sellPrice);
        if (Number.isNaN(costPrice) || Number.isNaN(sellPrice)) {
          throw new Error("costPrice and sellPrice must be numbers.");
        }

        const categoryId = await resolveCategoryId(row.category);
        const subCategoryId = await resolveSubCategoryId(row.subCategory, categoryId);
        const brandId = await resolveBrandId(row.brand);
        const baseUnitId = await resolveUnitId(row.baseUnit);
        const taxRate = row.taxRate ? Number(row.taxRate) : 0;

        const existing = await prisma.product.findUnique({ where: { sku } });

        if (existing) {
          await productService.update(
            existing.id,
            {
              name: row.name.trim(),
              barcode: row.barcode?.trim() || null,
              categoryId,
              subCategoryId,
              brandId,
              baseUnitId,
              costPrice,
              sellPrice,
              taxRate,
            },
            actorUserId
          );
          updated++;
          results.push({ row: rowNumber, sku, status: "updated" });
        } else {
          await productService.create(
            {
              name: row.name.trim(),
              sku,
              barcode: row.barcode?.trim() || null,
              categoryId,
              subCategoryId,
              brandId,
              baseUnitId,
              costPrice,
              sellPrice,
              taxRate,
            },
            actorUserId
          );
          created++;
          results.push({ row: rowNumber, sku, status: "created" });
        }
      } catch (err) {
        errors++;
        results.push({
          row: rowNumber,
          sku: sku ?? "(missing)",
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error.",
        });
      }
    }

    if (actorUserId && (created > 0 || updated > 0)) {
      await auditService
        .log(actorUserId, "update", "Product", "bulk-import", { created, updated, errors })
        .catch((err) => console.error("Failed to write bulk-import audit log:", err));
    }

    return { created, updated, errors, results };
  },
};
