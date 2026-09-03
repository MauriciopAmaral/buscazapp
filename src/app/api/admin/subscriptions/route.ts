import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/subscriptions — todas as assinaturas, com nome da
// empresa e do plano juntos, pro admin gerenciar.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    // Subscription.planoId não tem relação declarada com Plan no schema
    // (Plan.id é o próprio enum PlanoId, sem FK formal) — busca os planos
    // à parte (só 4 linhas) pra montar o nome de cada um.
    const [rows, planos] = await Promise.all([
      prisma.subscription.findMany({
        orderBy: { proximaCobranca: "asc" },
        include: { company: { select: { nomeFantasia: true, slug: true } } },
      }),
      prisma.plan.findMany({ select: { id: true, nome: true } }),
    ]);
    const nomePorPlano = new Map(planos.map((p) => [p.id, p.nome]));

    return ok(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      rows.map((s: any) => ({
        id: s.id,
        companyId: s.companyId,
        companyNome: s.company.nomeFantasia,
        companySlug: s.company.slug,
        planoId: s.planoId,
        planoNome: nomePorPlano.get(s.planoId) ?? s.planoId,
        periodicidade: s.periodicidade,
        status: s.status,
        proximaCobranca: s.proximaCobranca instanceof Date ? s.proximaCobranca.toISOString() : String(s.proximaCobranca),
        valor: Number(s.valor),
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/subscriptions]", err);
    return serverError();
  }
}
