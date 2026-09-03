import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/dashboard — indicadores e gráficos da home do painel
// admin (Admin → Dashboard). Tudo calculado na hora, direto no banco.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem ver essa página.");

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    trintaDiasAtras.setHours(0, 0, 0, 0);

    const [
      totalEmpresas,
      reivindicadas,
      premium,
      totalUsuarios,
      assinaturasAtivas,
      mrrAgg,
      totalLeads,
      cuponsAgg,
      serieRaw,
      assinantesPorPlano,
      planos,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { reivindicada: true } }),
      prisma.company.count({ where: { premium: true } }),
      prisma.user.count(),
      prisma.subscription.count({ where: { status: "ativa" } }),
      prisma.subscription.aggregate({ where: { status: "ativa" }, _sum: { valor: true } }),
      prisma.lead.count(),
      prisma.coupon.aggregate({ _sum: { utilizados: true } }),
      prisma.analyticsDaily.groupBy({
        by: ["data"],
        where: { data: { gte: trintaDiasAtras } },
        _sum: { visualizacoes: true },
        orderBy: { data: "asc" },
      }),
      prisma.company.groupBy({ by: ["planoId"], _count: { _all: true } }),
      prisma.plan.findMany({ select: { id: true, nome: true } }),
    ]);

    const nomePlano = new Map(planos.map((p) => [p.id, p.nome]));
    const planData = assinantesPorPlano
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      .map((r: any) => ({ name: nomePlano.get(r.planoId) ?? r.planoId, value: r._count._all }))
      .filter((p) => p.value > 0);

    const serie = serieRaw.map((r) => ({
      data: r.data instanceof Date ? r.data.toISOString().slice(0, 10) : String(r.data).slice(0, 10),
      visualizacoes: r._sum.visualizacoes ?? 0,
    }));

    return ok({
      totalEmpresas,
      reivindicadas,
      premium,
      totalUsuarios,
      assinaturasAtivas,
      mrr: Number(mrrAgg._sum.valor ?? 0),
      totalLeads,
      cuponsUtilizados: cuponsAgg._sum.utilizados ?? 0,
      serie,
      planData,
    });
  } catch (err) {
    console.error("[GET /api/admin/dashboard]", err);
    return serverError();
  }
}
