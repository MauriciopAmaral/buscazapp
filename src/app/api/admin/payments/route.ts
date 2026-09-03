import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/payments — todos os pagamentos, com nome da empresa
// junto, mais os totais (receita recebida, MRR, pendente) já calculados
// pro admin não precisar somar isso no navegador.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const [pagamentos, assinaturasAtivas] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { data: "desc" },
        include: { company: { select: { nomeFantasia: true, slug: true, whatsapp: true } } },
      }),
      prisma.subscription.aggregate({ where: { status: "ativa" }, _sum: { valor: true } }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
    const lista = pagamentos.map((p: any) => ({
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

    const receita = lista.filter((p) => p.status === "pago").reduce((acc, p) => acc + p.valor, 0);
    const pendente = lista.filter((p) => p.status === "pendente").reduce((acc, p) => acc + p.valor, 0);
    const mrr = Number(assinaturasAtivas._sum.valor ?? 0);

    return ok({ pagamentos: lista, totais: { receita, pendente, mrr } });
  } catch (err) {
    console.error("[GET /api/admin/payments]", err);
    return serverError();
  }
}
