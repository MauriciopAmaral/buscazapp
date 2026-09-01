import { PrismaClient } from "@prisma/client";

// Evita criar múltiplas instâncias do Prisma Client durante hot-reload
// no desenvolvimento (padrão recomendado pela documentação do Next.js).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
