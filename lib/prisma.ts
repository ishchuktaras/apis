/**
 * Prisma Client for Self-Hosted PostgreSQL
 * ==============================================================
 * WEDOS VPS ON: ov8760 (4 GB RAM, 30 GB SSD)
 * Database: PostgreSQL 16 Alpine
 * ==============================================================
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // Connection pool settings optimized for VPS ON 4GB RAM
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Graceful shutdown
 */
export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
