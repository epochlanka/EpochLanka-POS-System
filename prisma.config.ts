import "dotenv/config";
import { defineConfig } from "@prisma/config";

const isPostgres = process.env.NODE_ENV === "production" || process.env.USE_POSTGRES === "true";

export default defineConfig({
  schema: isPostgres ? "prisma/schema.postgres.prisma" : "prisma/schema.sqlite.prisma",
  datasource: {
    url: isPostgres 
      ? (process.env.DATABASE_URL_CLOUD || "") 
      : (process.env.DATABASE_URL_LOCAL || "file:./dev.db"),
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
