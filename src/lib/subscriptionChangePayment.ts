import type { Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

type PaymentResponse = Awaited<ReturnType<InstanceType<typeof Payment>["get"]>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, que este sandbox não consegue rodar (ver AGENTS.md / HOSTINGER_MYSQL_SETUP.md); na Vercel o build gera o client normalmente.
type SubscriptionChangeAtual = any;

export const NOMES_PLANO: Record<string, string> = {
  gratuito: "Gratuito",
  pro: "Pro",
  premium: "Premium",
  premium_plus: "Premium+",
};

export function diasDoPeriodo(periodicidade: string): number {
  return periodicidade === "mensal" ? 30 : periodicidade === "trimestral" ? 90 : 365;
}

/** Aplica de verdade a troca de plano: atualiza (ou cria) a `Subscription`
 * da empresa, o `planoId` na própria `Company` (usado nas listagens
 * públicas), e grava um `Payment` no histórico — mesmo efeito colateral
 * tanto pra troca paga (depois da confirmação do Mercado Pago) quanto pra
 * troca pro plano Gratuito (sem cobrança nenhuma). */
async function aplicarTrocaDePlano(change: SubscriptionChangeAtual) {
  const dias = diasDoPeriodo(change.periodicidade);
  const proximaCobranca = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  const nomePlano = NOMES_PLANO[change.planoId] ?? change.planoId;

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { companyId: change.companyId },
      update: {
        planoId: change.planoId,
        periodicidade: change.periodicidade,
        status: "ativa",
        proximaCobranca,
        valor: change.valor,
      },
      create: {
        companyId: change.companyId,
        planoId: change.planoId,
        periodicidade: change.periodicidade,
        status: "ativa",
        proximaCobranca,
        valor: change.valor,
      },
    }),
    prisma.company.update({ where: { id: change.companyId }, data: { planoId: change.planoId } }),
    prisma.payment.create({
      data: {
        companyId: change.companyId,
        data: new Date(),
        valor: change.valor,
        status: "pago",
        descricao:
          Number(change.valor) === 0
            ? `Troca de plano — ${nomePlano} (sem cobrança)`
            : `Assinatura — ${nomePlano} (${change.periodicidade})`,
      },
    }),
  ]);
}

/** Troca direta pro plano Gratuito (ou qualquer plano de valor zero) — sem
 * passar pelo Mercado Pago, já que não tem nada pra cobrar. Marca a
 * SubscriptionChange como "pago" na hora (não tem `mpPaymentId`, mas isso é
 * um campo opcional — MySQL permite múltiplos `NULL` num índice único). */
export async function aplicarTrocaGratuita(change: SubscriptionChangeAtual) {
  if (change.status === "pago") return change;
  await aplicarTrocaDePlano(change);
  return prisma.subscriptionChange.update({ where: { id: change.id }, data: { status: "pago" } });
}

/** Idêntico em espírito ao aplicarStatusPagamento do Boost/PlanPurchase:
 * único ponto que decide o que fazer com o status de um pagamento de troca
 * de plano, usado tanto pelo webhook quanto pela consulta self-healing
 * (GET /api/painel/subscription/mudar/[id]). */
export async function aplicarStatusPagamentoMudancaPlano(change: SubscriptionChangeAtual, payment: PaymentResponse) {
  if (change.status === "pago") return change;

  if (payment.status === "approved") {
    await aplicarTrocaDePlano(change);
    return prisma.subscriptionChange.update({
      where: { id: change.id },
      data: { status: "pago", mpPaymentId: String(payment.id) },
    });
  }

  if (payment.status === "rejected" || payment.status === "cancelled") {
    return prisma.subscriptionChange.update({
      where: { id: change.id },
      data: { status: "cancelado", mpPaymentId: String(payment.id) },
    });
  }

  return prisma.subscriptionChange.update({
    where: { id: change.id },
    data: { mpPaymentId: String(payment.id) },
  });
}
