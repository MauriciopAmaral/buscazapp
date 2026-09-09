// ============================================================
// BuscaZapp — processamento de pagamento de um Impulsionar (Boost)
//
// Lógica compartilhada entre dois lugares que recebem o status de um
// pagamento do Mercado Pago:
//   1. POST /api/painel/boosts/[id]/pagar — resultado imediato de quando
//      a própria empresa paga (cartão aprovado/recusado na hora, ou Pix
//      criado e ainda pendente).
//   2. POST /api/webhooks/mercadopago — a notificação que o Mercado Pago
//      manda sozinho quando o status de um pagamento muda (é o que
//      confirma o Pix depois que a pessoa paga, por exemplo).
//
// Os dois cenários podem chegar em qualquer ordem (às vezes o webhook
// chega antes da resposta síncrona voltar pro navegador), então essa
// função é sempre idempotente: só ativa o impulsionamento uma vez.
// ============================================================

import type { Payment } from "mercadopago";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PaymentResponse = Awaited<ReturnType<InstanceType<typeof Payment>["get"]>>;
type BoostAtual = Awaited<ReturnType<typeof prisma.boost.findUnique>>;

/**
 * Aplica o status de um pagamento (já confirmado direto na API do Mercado
 * Pago — nunca a partir de um corpo de requisição não verificado) a um
 * Boost. Idempotente: se o Boost já estiver "pago", não faz nada.
 */
export async function aplicarStatusPagamento(boost: NonNullable<BoostAtual>, payment: PaymentResponse) {
  if (boost.status === "pago") {
    return prisma.boost.findUnique({ where: { id: boost.id }, include: { ad: true } });
  }

  if (payment.status === "approved") {
    const agora = new Date();
    const termino = new Date(agora.getTime() + boost.dias * 24 * 60 * 60 * 1000);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ad = await tx.ad.create({
        data: {
          companyId: boost.companyId,
          tipo: boost.tipo,
          inicio: agora,
          termino,
          status: "ativo",
        },
      });
      return tx.boost.update({
        where: { id: boost.id },
        data: {
          status: "pago",
          mpPaymentId: String(payment.id),
          adId: ad.id,
        },
        include: { ad: true },
      });
    });
  }

  if (payment.status === "rejected" || payment.status === "cancelled") {
    return prisma.boost.update({
      where: { id: boost.id },
      data: { status: "cancelado", mpPaymentId: String(payment.id) },
      include: { ad: true },
    });
  }

  // pending / in_process (ex: Pix ainda não pago) — guarda o ID do
  // pagamento pra achar o Boost rápido quando o webhook confirmar depois.
  return prisma.boost.update({
    where: { id: boost.id },
    data: { mpPaymentId: String(payment.id) },
    include: { ad: true },
  });
}
