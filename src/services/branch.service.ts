import { prisma } from "@/lib/prisma";

export class BranchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BranchError";
  }
}

export interface BranchInput {
  name: string;
  address?: string | null;
}

export interface WarehouseInput {
  name: string;
  branchId?: string | null;
}

export const branchService = {
  async list() {
    return prisma.branch.findMany({
      include: { warehouses: true },
      orderBy: { name: "asc" },
    });
  },

  async create(data: BranchInput) {
    return prisma.branch.create({ data: { name: data.name, address: data.address ?? null } });
  },

  async update(id: string, data: Partial<BranchInput>) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new BranchError("Branch not found.");
    }
    return prisma.branch.update({ where: { id }, data });
  },
};

export const warehouseService = {
  async list() {
    return prisma.warehouse.findMany({
      include: { branch: true },
      orderBy: { name: "asc" },
    });
  },

  async create(data: WarehouseInput) {
    return prisma.warehouse.create({
      data: { name: data.name, branchId: data.branchId ?? null },
    });
  },

  async update(id: string, data: Partial<WarehouseInput>) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new BranchError("Warehouse not found.");
    }
    return prisma.warehouse.update({ where: { id }, data });
  },
};
