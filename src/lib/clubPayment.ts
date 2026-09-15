import type { Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout, emailConfigured } from "@/lib/emailSender";

type PaymentResponse = Awaited<ReturnType<InstanceType<typeof Payment>["get"]>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, que este sandbox não consegue rodar (ver AGENTS.md / HOSTINGER_MYSQL_SETUP.md); na Vercel o build gera o client normalmente.
type ClubPurchaseAtual = any;

const DIAS_CICLO_CLUBE = 30;

async function enviarEmailAssinaturaConfirmada(userId: string, valor: number) {
  if (!emailConfigured()) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { nome: true, email: true } });
  if (!user) return;
  await sendEmail({
    to: user.email,
    subject: "Assinatura do BuscaZapp Clube confirmada!",
    html: emailLayout(
      "Clube",
      `
      <h2 style="margin:0 0 12px; font-size:18px; color:#111827;">Bem-vindo ao BuscaZapp Clube, ${user.nome}!</h2>
      <p style="color:#374151; font-size:14px; line-height:1.6;">
        Seu pagamento de <strong>R$ ${valor.toFixed(2).replace(".", ",")}</strong> foi confirmado e sua assinatura já
        está ativa. A partir de agora você tem acesso aos cupons exclusivos de 2x1 e descontos nos restaurantes
        parceiros do Clube.
      </p>
      <p style="color:#374151; font-size:14px; line-height:1.6;">
        Sua assinatura é renovada manualmente todo mês — a gente manda um lembrete por e-mail perto do
        vencimento, com o link direto pra pagar.
      </p>
      `
    ),
  });
}

/** Aplica de verdade a assinatura do Clube: atualiza (ou cria) a
 * `ClubSubscription` do usuário e marca `User.clubeAssinante = true` — usado
 * tanto pra primeira assinatura quanto pra renovação. */
async function aplicarAssinaturaClube(purchase: ClubPurchaseAtual) {
  const proximaCobranca = new Date(Date.now() + DIAS_CICLO_CLUBE * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.clubSubscription.upsert({
      where: { userId: purchase.userId },
      update: { status: "ativa", proximaCobranca, valor: purchase.valor, lembreteEnviadoEm: null },
      create: { userId: purchase.userId, status: "ativa", proximaCobranca, valor: purchase.valor },
    }),
    prisma.user.update({ where: { id: purchase.userId }, data: { clubeAssinante: true } }),
  ]);

  await enviarEmailAssinaturaConfirmada(purchase.userId, Number(purchase.valor));
}

/** Único ponto que decide o que fazer com o status de um pagamento do
 * Clube, usado tanto pelo webhook quanto pela consulta self-healing (GET
 * /api/clube/assinar/[id]) — idêntico em espírito ao aplicarStatusPagamento
 * do Boost/PlanPurchase/SubscriptionChange. */
export async function aplicarStatusPagamentoClube(purchase: ClubPurchaseAtual, payment: PaymentResponse) {
  if (purchase.status === "pago") return purchase;

  if (payment.status === "approved") {
    await aplicarAssinaturaClube(purchase);
    return prisma.clubPurchase.update({
      where: { id: purchase.id },
      data: { status: "pago", mpPaymentId: String(payment.id) },
    });
  }

  if (payment.status === "rejected" || payment.status === "cancelled") {
    return prisma.clubPurchase.update({
      where: { id: purchase.id },
      data: { status: "cancelado", mpPaymentId: String(payment.id) },
    });
  }

  return prisma.clubPurchase.update({
    where: { id: purchase.id },
    data: { mpPaymentId: String(payment.id) },
  });
}
