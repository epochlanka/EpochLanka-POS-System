import { prisma } from "@/lib/prisma";

export class BrandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrandError";
  }
}

export interface BrandInput {
  name: string;
}

export const brandService = {
  async list(includeInactive = false) {
    return prisma.brand.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    return prisma.brand.findUnique({ where: { id } });
  },

  async create(data: BrandInput) {
    const existing = await prisma.brand.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new BrandError("A brand with this name already exists.");
    }
    return prisma.brand.create({ data: { name: data.name } });
  },

  async update(id: string, data: Partial<BrandInput>) {
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new BrandError("Brand not found.");
    }
    return prisma.brand.update({ where: { id }, data });
  },

  async deactivate(id: string) {
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new BrandError("Brand not found.");
    }
    return prisma.brand.update({ where: { id }, data: { isActive: false } });
  },

  async reactivate(id: string) {
    return prisma.brand.update({ where: { id }, data: { isActive: true } });
  },
};
