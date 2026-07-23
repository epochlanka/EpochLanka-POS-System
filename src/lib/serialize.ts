import { Prisma } from "@prisma/client";

/**
 * Prisma's `Decimal` fields (costPrice, sellPrice, etc.) are objects, not
 * plain numbers — JSON.stringify-ing them directly produces `{}` or throws
 * depending on the runtime. Walk the object and convert any Decimal (and
 * nested arrays/objects) into a plain number before handing it to
 * NextResponse.json.
 *
 * Note: we import `Decimal` via `Prisma.Decimal` (the public, documented
 * export) rather than `@prisma/client/runtime/library` — the latter is a
 * private internal path that isn't guaranteed to resolve the same way
 * across Prisma versions/generators and has broken for people on upgrades.
 */
export function serializeDecimals<T>(value: T): T {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber() as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeDecimals(item)) as unknown as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeDecimals(val);
    }
    return result as T;
  }
  return value;
}