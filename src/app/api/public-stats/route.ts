import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/apiResponse";

// GET /api/public-stats — indicadores públicos e reais da plataforma (sem
// autenticação), usados na página "Para empresas" pra mostrar números de
// verdade (empresas ativas, cidades atendidas, avaliação média, cliques no
// WhatsApp/mês) em vez de dados fictícios de mock.
export async function GET() {
  try {
    const [totalEmpresas, cidadesDistintas, avaliacaoAgg, cliquesAgg] = await Promise.all([
      prisma.company.count({ where: { status: "ativo" } }),
      prisma.company.findMany({ where: { status: "ativo" }, select: { cidadeNome: true }, distinct: ["cidadeNome"] }),
      prisma.company.aggregate({ where: { status: "ativo", totalAvaliacoes: { gt: 0 } }, _avg: { avaliacaoMedia: true } }),
      prisma.companyAnalytics.aggregate({ _sum: { cliquesWhatsapp: true } }),
    ]);

    return ok({
      empresas: totalEmpresas,
      cidades: cidadesDistintas.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, que este sandbox não consegue rodar (ver AGENTS.md / HOSTINGER_MYSQL_SETUP.md); na Vercel o build gera o client normalmente.
      cidadesNomes: cidadesDistintas.map((c: any) => c.cidadeNome as string).sort(),
      avaliacaoMedia: Number((avaliacaoAgg._avg.avaliacaoMedia ?? 0).toFixed(1)),
      cliquesWhatsappMes: cliquesAgg._sum.cliquesWhatsapp ?? 0,
    });
  } catch (err) {
    console.error("[GET /api/public-stats]", err);
    return serverError();
  }
}
