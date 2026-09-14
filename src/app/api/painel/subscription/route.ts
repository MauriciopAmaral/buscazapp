import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/subscription — plano/assinatura real da empresa logada
// (Painel → Assinatura e Painel → Financeiro), mais o histórico de
// pagamentos de verdade (tabela `Payment`, que troca de plano também
// grava — ver src/lib/subscriptionChangePayment.ts). Antes essas duas
// telas eram 100% mock (nem liam a empresa de quem estava logado).
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const [company, subscription, payments] = await Promise.all([
      prisma.company.findUnique({ where: { id: auth.companyId }, select: { planoId: true } }),
      prisma.subscription.findUnique({ where: { companyId: auth.companyId } }),
      prisma.payment.findMany({ where: { companyId: auth.companyId }, orderBy: { data: "desc" } }),
    ]);

    return ok({
      planoId: company?.planoId ?? "gratuito",
      subscription: subscription
        ? {
            planoId: subscription.planoId,
            periodicidade: subscription.periodicidade,
            status: subscription.status,
            proximaCobranca: subscription.proximaCobranca.toISOString(),
            valor: Number(subscription.valor),
          }
        : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      payments: (payments as any[]).map((p) => ({
        id: p.id,
        data: p.data instanceof Date ? p.data.toISOString() : String(p.data),
        descricao: p.descricao,
        valor: Number(p.valor),
        status: p.status,
      })),
    });
  } catch (err) {
    console.error("[GET /api/painel/subscription]", err);
    return serverError();
  }
}
