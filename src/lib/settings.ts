import { prisma } from "@/lib/prisma";

// Configurações da plataforma são um registro único (id fixo "singleton").
// Essa função garante que ele sempre exista — se o banco nunca teve essa
// linha criada (ex: schema novo, sem seed), cria com os valores padrão na
// primeira leitura, mesmo padrão de "self-healing" usado em /api/admin/plans.
export async function getOrCreateSettings() {
  return prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}
