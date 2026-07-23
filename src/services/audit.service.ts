import { prisma } from "@/lib/prisma";

export type AuditAction = "create" | "update" | "deactivate" | "reactivate" | "delete";

export const auditService = {
  /** Fire-and-forget style write — callers should not let a logging failure block the main action, but we still await it here so callers can catch/log if they want. */
  async log(userId: string, action: AuditAction, entity: string, entityId: string, details?: Record<string, unknown>) {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ?? undefined,
      },
    });
  },

  async listForEntity(entity: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entity, entityId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async listRecent(entity?: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: entity ? { entity } : {},
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};

/**
 * Given a "before" and "after" snapshot of a record, returns only the fields
 * that actually changed — this is what gets stored in AuditLog.details so a
 * viewer can see e.g. { sellPrice: { from: 100, to: 120 } } instead of two
 * full product dumps.
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after) as (keyof T)[]) {
    const beforeValue = before[key];
    const afterValue = after[key];
    if (afterValue === undefined) continue;
    const normalizedBefore = beforeValue instanceof Object && "toNumber" in beforeValue ? (beforeValue as any).toNumber() : beforeValue;
    if (normalizedBefore !== afterValue) {
      changes[key as string] = { from: normalizedBefore, to: afterValue };
    }
  }
  return changes;
}
