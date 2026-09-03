import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// Mesmos 4 planos que sempre existiram no site (ver src/mocks/subscriptions.ts
// e prisma/seed.ts) — usados só como "valor de fábrica" pra garantir que a
// tabela Plan nunca apareça vazia no admin, mesmo em bancos onde o seed.ts
// nunca chegou a rodar. Uma vez que a linha existe no banco, essa lista
// deixa de importar: o admin edita o registro real.
const PLANOS_PADRAO = [
  {
    id: "gratuito" as const,
    nome: "Gratuito",
    precoMensal: 0,
    precoTrimestral: 0,
    precoAnual: 0,
    destaque: false,
    recursos: ["Perfil básico da empresa", "Até 3 fotos na galeria", "Receber avaliações", "1 cupom ativo por vez"],
  },
  {
    id: "pro" as const,
    nome: "Pro",
    precoMensal: 49.9,
    precoTrimestral: 134.9,
    precoAnual: 479.9,
    destaque: false,
    recursos: ["Tudo do Gratuito", "Galeria ilimitada", "Até 5 promoções ativas", "Até 5 cupons ativos", "Selo Verificado", "Estatísticas básicas"],
  },
  {
    id: "premium" as const,
    nome: "Premium",
    precoMensal: 99.9,
    precoTrimestral: 269.9,
    precoAnual: 959.9,
    destaque: true,
    recursos: ["Tudo do Pro", "Selo Premium", "Destaque nos resultados de busca", "Promoções e cupons ilimitados", "Estatísticas avançadas", "Suporte prioritário"],
  },
  {
    id: "premium_plus" as const,
    nome: "Premium+",
    precoMensal: 189.9,
    precoTrimestral: 509.9,
    precoAnual: 1799.9,
    destaque: false,
    recursos: ["Tudo do Premium", "Destaque na Home", "Anúncios patrocinados inclusos", "Gerente de conta dedicado", "Relatórios personalizados"],
  },
];

// GET /api/admin/plans — os 4 planos, com preços/recursos reais do banco e
// o total de assinantes de cada um (empresas com `planoId` == esse plano).
// Se algum dos 4 ainda não existir na tabela Plan (banco nunca rodou o
// seed), ele é criado na hora com os valores padrão acima.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    for (const p of PLANOS_PADRAO) {
      await prisma.plan.upsert({
        where: { id: p.id },
        update: {},
        create: p,
      });
    }

    const [planos, contagens] = await Promise.all([
      prisma.plan.findMany({ orderBy: { precoMensal: "asc" } }),
      prisma.company.groupBy({ by: ["planoId"], _count: { _all: true } }),
    ]);

    const assinantesPorPlano = new Map(contagens.map((c) => [c.planoId, c._count._all]));

    return ok(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      planos.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        precoMensal: Number(p.precoMensal),
        precoTrimestral: Number(p.precoTrimestral),
        precoAnual: Number(p.precoAnual),
        destaque: p.destaque,
        recursos: Array.isArray(p.recursos) ? p.recursos : [],
        assinantes: assinantesPorPlano.get(p.id) ?? 0,
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/plans]", err);
    return serverError();
  }
}
