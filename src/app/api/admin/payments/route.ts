import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";
import { BOOST_CATALOGO, formatDias, type BoostTipo } from "@/lib/boostCatalog";

// Impulsionamentos (Painel > Impulsionar) não gravam na tabela `Payment` —
// têm a tabela própria `Boost` (ver src/lib/boostPayment.ts). Pra essa tela
// de Financeiro mostrar o dinheiro real que entra pelo Impulsionar (e não
// só assinaturas/outras cobranças), o status do Boost é convertido pro
// mesmo formato de status usado aqui: "pago"/"pendente" batem direto,
// "cancelado"/"expirado" viram "falhou" (não tem status próprio de boost
// nesta tela, e nenhum dos dois representa dinheiro recebido).
function statusBoostParaPayment(status: string): "pago" | "pendente" | "falhou" {
  if (status === "pago") return "pago";
  if (status === "pendente") return "pendente";
  return "falhou";
}

// GET /api/admin/payments — todos os pagamentos, com nome da empresa
// junto, mais os totais (receita recebida, MRR, pendente) já calculados
// pro admin não precisar somar isso no navegador.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const [pagamentos, boosts, assinaturasAtivas] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { data: "desc" },
        include: { company: { select: { nomeFantasia: true, slug: true, whatsapp: true } } },
      }),
      prisma.boost.findMany({
        orderBy: { createdAt: "desc" },
        include: { company: { select: { nomeFantasia: true, slug: true, whatsapp: true } } },
      }),
      prisma.subscription.aggregate({ where: { status: "ativa" }, _sum: { valor: true } }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
    const listaPagamentos = pagamentos.map((p: any) => ({
      id: p.id,
      companyId: p.companyId,
      companyNome: p.company.nomeFantasia,
      companySlug: p.company.slug,
      companyWhatsapp: p.company.whatsapp,
      descricao: p.descricao,
      data: p.data instanceof Date ? p.data.toISOString() : String(p.data),
      valor: Number(p.valor),
      status: p.status,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
    const listaBoosts = boosts.map((b: any) => ({
      id: `boost-${b.id}`,
      companyId: b.companyId,
      companyNome: b.company.nomeFantasia,
      companySlug: b.company.slug,
      companyWhatsapp: b.company.whatsapp,
      descricao: `Impulsionar — ${BOOST_CATALOGO[b.tipo as BoostTipo]?.nome ?? b.tipo} (${formatDias(b.dias)})`,
      data: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
      valor: Number(b.valor),
      status: statusBoostParaPayment(b.status),
    }));

    const lista = [...listaPagamentos, ...listaBoosts].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    const receita = lista.filter((p) => p.status === "pago").reduce((acc, p) => acc + p.valor, 0);
    const pendente = lista.filter((p) => p.status === "pendente").reduce((acc, p) => acc + p.valor, 0);
    const mrr = Number(assinaturasAtivas._sum.valor ?? 0);

    return ok({ pagamentos: lista, totais: { receita, pendente, mrr } });
  } catch (err) {
    console.error("[GET /api/admin/payments]", err);
    return serverError();
  }
}
