import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/reports — indicadores consolidados da plataforma, pra
// alimentar os cards e gráficos da tela Admin → Relatórios. Tudo calculado
// direto no banco (nada de mockup).
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem ver essa página.");

    const [
      totalEmpresas,
      totalCategorias,
      totalCidades,
      assinaturasAtivas,
      totalLeads,
      receitaAgg,
      empresasPorCidadeRaw,
      empresasPorCategoriaRaw,
      leadsPorOrigemRaw,
      categorias,
      analyticsAgg,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.category.count(),
      prisma.city.count(),
      prisma.subscription.count({ where: { status: "ativa" } }),
      prisma.lead.count(),
      prisma.payment.aggregate({ where: { status: "pago" }, _sum: { valor: true } }),
      prisma.company.groupBy({ by: ["cidadeNome"], _count: { _all: true } }),
      prisma.company.groupBy({ by: ["categoriaId"], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["origem"], _count: { _all: true } }),
      prisma.category.findMany({ select: { id: true, nome: true } }),
      prisma.companyAnalytics.aggregate({ _sum: { visualizacoes: true, leads: true } }),
    ]);

    const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]));

    const empresasPorCidade = empresasPorCidadeRaw
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      .map((r: any) => ({ nome: r.cidadeNome, total: r._count._all }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const empresasPorCategoria = empresasPorCategoriaRaw
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({ nome: nomeCategoria.get(r.categoriaId) ?? "—", total: r._count._all }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const leadsPorOrigem = leadsPorOrigemRaw
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({ nome: r.origem, total: r._count._all }));

    const visualizacoes = analyticsAgg._sum.visualizacoes ?? 0;
    const leadsComAnalytics = analyticsAgg._sum.leads ?? 0;
    const taxaConversao = visualizacoes > 0 ? (leadsComAnalytics / visualizacoes) * 100 : 0;

    return ok({
      totais: {
        empresas: totalEmpresas,
        categorias: totalCategorias,
        cidades: totalCidades,
        assinaturasAtivas,
        leads: totalLeads,
        receita: Number(receitaAgg._sum.valor ?? 0),
        taxaConversao: Number(taxaConversao.toFixed(1)),
      },
      empresasPorCidade,
      empresasPorCategoria,
      leadsPorOrigem,
    });
  } catch (err) {
    console.error("[GET /api/admin/reports]", err);
    return serverError();
  }
}
