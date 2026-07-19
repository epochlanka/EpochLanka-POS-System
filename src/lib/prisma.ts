import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const isPostgres = process.env.NODE_ENV === "production" || process.env.USE_POSTGRES === "true";

  if (isPostgres) {
    // Dynamically require Postgres adapter to avoid load failures in local SQLite mode
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL_CLOUD });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({ adapter });
  } else {
    // Local SQLite database adapter
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL_LOCAL || "file:./dev.db"
    });
    prismaInstance = new PrismaClient({ adapter });
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
