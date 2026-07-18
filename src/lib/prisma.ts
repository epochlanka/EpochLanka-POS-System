// Prisma client wrapper for dual-database strategy (SQLite/Postgres)
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// This will eventually contain logic to switch between local SQLite and cloud Postgres
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
