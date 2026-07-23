import { prisma } from "@/lib/prisma";

export class AttributeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttributeError";
  }
}

export const attributeService = {
  async list() {
    return prisma.attribute.findMany({
      include: { values: true },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    return prisma.attribute.findUnique({
      where: { id },
      include: { values: true },
    });
  },

  async create(name: string, values: string[] = []) {
    const existing = await prisma.attribute.findUnique({ where: { name } });
    if (existing) {
      throw new AttributeError("An attribute with this name already exists.");
    }
    return prisma.attribute.create({
      data: {
        name,
        values: { create: values.map((value) => ({ value })) },
      },
      include: { values: true },
    });
  },

  async remove(id: string) {
    const attribute = await prisma.attribute.findUnique({ where: { id } });
    if (!attribute) {
      throw new AttributeError("Attribute not found.");
    }
    const inUse = await prisma.productVariantAttribute.count({
      where: { attributeValue: { attributeId: id } },
    });
    if (inUse > 0) {
      throw new AttributeError("This attribute is used by one or more product variants and can't be deleted.");
    }
    // AttributeValue rows cascade-delete via onDelete: Cascade in the schema.
    return prisma.attribute.delete({ where: { id } });
  },

  async addValue(attributeId: string, value: string) {
    const attribute = await prisma.attribute.findUnique({ where: { id: attributeId } });
    if (!attribute) {
      throw new AttributeError("Attribute not found.");
    }
    const existing = await prisma.attributeValue.findFirst({
      where: { attributeId, value: { equals: value } },
    });
    if (existing) {
      throw new AttributeError("This value already exists for this attribute.");
    }
    return prisma.attributeValue.create({ data: { attributeId, value } });
  },

  async removeValue(valueId: string) {
    const value = await prisma.attributeValue.findUnique({ where: { id: valueId } });
    if (!value) {
      throw new AttributeError("Attribute value not found.");
    }
    const inUse = await prisma.productVariantAttribute.count({ where: { attributeValueId: valueId } });
    if (inUse > 0) {
      throw new AttributeError("This value is used by one or more product variants and can't be deleted.");
    }
    return prisma.attributeValue.delete({ where: { id: valueId } });
  },
};
