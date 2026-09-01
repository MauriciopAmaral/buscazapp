import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/analytics — totais + série diária (últimos 90 dias) da empresa logada.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const [totals, company, serie] = await Promise.all([
      prisma.companyAnalytics.findUnique({ where: { companyId: auth.companyId } }),
      prisma.company.findUnique({ where: { id: auth.companyId }, select: { avaliacaoMedia: true } }),
      prisma.analyticsDaily.findMany({
        where: { companyId: auth.companyId },
        orderBy: { data: "asc" },
        take: 90,
      }),
    ]);

    return ok({
      companyId: auth.companyId,
      visualizacoes: totals?.visualizacoes ?? 0,
      cliquesWhatsapp: totals?.cliquesWhatsapp ?? 0,
      leads: totals?.leads ?? 0,
      cuponsUtilizados: totals?.cuponsUtilizados ?? 0,
      avaliacao: company?.avaliacaoMedia ?? 0,
      serieDiaria: serie.map((s) => ({
        data: (s.data instanceof Date ? s.data.toISOString() : String(s.data)).slice(0, 10),
        visualizacoes: s.visualizacoes,
        cliquesWhatsapp: s.cliquesWhatsapp,
        leads: s.leads,
        cuponsUtilizados: s.cuponsUtilizados,
      })),
    });
  } catch (err) {
    console.error("[GET /api/painel/analytics]", err);
    return serverError();
  }
}
