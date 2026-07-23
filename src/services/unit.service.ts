import { prisma } from "@/lib/prisma";

export class UnitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnitError";
  }
}

export interface UnitInput {
  name: string;
  symbol: string;
}

export interface UnitConversionInput {
  fromUnitId: string;
  toUnitId: string;
  factor: number;
}

export const unitService = {
  async list() {
    return prisma.unit.findMany({ orderBy: { name: "asc" } });
  },

  async getById(id: string) {
    return prisma.unit.findUnique({
      where: { id },
      include: { conversionsFrom: { include: { toUnit: true } } },
    });
  },

  async create(data: UnitInput) {
    const existing = await prisma.unit.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new UnitError("A unit with this name already exists.");
    }
    return prisma.unit.create({ data });
  },

  async update(id: string, data: Partial<UnitInput>) {
    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      throw new UnitError("Unit not found.");
    }
    return prisma.unit.update({ where: { id }, data });
  },

  /** Hard delete — units aren't soft-deletable since products reference them by required-looking FK in the UI; block if in use. */
  async remove(id: string) {
    const inUse = await prisma.product.count({ where: { baseUnitId: id } });
    if (inUse > 0) {
      throw new UnitError("This unit is used by one or more products and can't be deleted.");
    }
    await prisma.unitConversion.deleteMany({
      where: { OR: [{ fromUnitId: id }, { toUnitId: id }] },
    });
    return prisma.unit.delete({ where: { id } });
  },

  async listConversions() {
    return prisma.unitConversion.findMany({
      include: { fromUnit: true, toUnit: true },
      orderBy: { fromUnit: { name: "asc" } },
    });
  },

  async createConversion(data: UnitConversionInput) {
    if (data.fromUnitId === data.toUnitId) {
      throw new UnitError("Cannot create a conversion between a unit and itself.");
    }
    if (data.factor <= 0) {
      throw new UnitError("Conversion factor must be greater than zero.");
    }

    const [fromUnit, toUnit] = await Promise.all([
      prisma.unit.findUnique({ where: { id: data.fromUnitId } }),
      prisma.unit.findUnique({ where: { id: data.toUnitId } }),
    ]);
    if (!fromUnit || !toUnit) {
      throw new UnitError("One or both units were not found.");
    }

    const existing = await prisma.unitConversion.findUnique({
      where: { fromUnitId_toUnitId: { fromUnitId: data.fromUnitId, toUnitId: data.toUnitId } },
    });
    if (existing) {
      throw new UnitError("A conversion between these units already exists.");
    }

    return prisma.unitConversion.create({ data });
  },

  async removeConversion(id: string) {
    const conversion = await prisma.unitConversion.findUnique({ where: { id } });
    if (!conversion) {
      throw new UnitError("Conversion not found.");
    }
    return prisma.unitConversion.delete({ where: { id } });
  },
};
