import type { Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { siteBaseUrl } from "@/lib/mercadopago";
import { sendEmail, emailLayout } from "@/lib/emailSender";

type PaymentResponse = Awaited<ReturnType<InstanceType<typeof Payment>["get"]>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, que este sandbox não consegue rodar (ver AGENTS.md / HOSTINGER_MYSQL_SETUP.md); na Vercel o build gera o client normalmente.
type PlanPurchaseAtual = any;

const NOMES_PLANO: Record<string, string> = {
  gratuito: "Gratuito",
  pro: "Pro",
  premium: "Premium",
  premium_plus: "Premium+",
};

const NOMES_PERIODO: Record<string, string> = {
  mensal: "mensal",
  trimestral: "trimestral",
  anual: "anual",
};

/** Manda o e-mail com o link pra completar o cadastro, depois que o
 * pagamento do plano foi aprovado. */
async function enviarEmailLinkCadastro(purchase: PlanPurchaseAtual) {
  const link = `${siteBaseUrl()}/cadastro?planoToken=${purchase.cadastroToken}&email=${encodeURIComponent(purchase.email)}`;
  const nomePlano = NOMES_PLANO[purchase.planoId] ?? purchase.planoId;
  await sendEmail({
    to: purchase.email,
    subject: `Pagamento aprovado — falta só completar seu cadastro no BuscaZapp`,
    html: emailLayout(
      "Confirmação de pagamento",
      `
      <h1 style="font-size:18px; color:#111827; margin:0 0 12px;">Recebemos seu pagamento! 🎉</h1>
      <p style="font-size:14px; color:#374151; line-height:1.6;">
        Olá, ${purchase.nome}! Confirmamos o pagamento do plano <strong>${nomePlano}</strong>
        (${NOMES_PERIODO[purchase.periodicidade] ?? purchase.periodicidade}).
        Falta só um passo: complete seu cadastro clicando no botão abaixo pra criar sua conta
        e o perfil da sua empresa — seu plano já entra ativo automaticamente.
      </p>
      <div style="text-align:center; margin:22px 0;">
        <a href="${link}" style="display:inline-block; background:#16a34a; color:#fff; text-decoration:none; font-weight:600; font-size:14px; padding:12px 22px; border-radius:10px;">
          Completar meu cadastro
        </a>
      </div>
      <p style="font-size:12px; color:#9ca3af;">
        Se o botão não funcionar, copie e cole este link no navegador:<br/>
        <a href="${link}" style="color:#16a34a;">${link}</a>
      </p>`
    ),
  });
}

/** Idêntico em espírito ao aplicarStatusPagamento do Boost (src/lib/boostPayment.ts):
 * único ponto que decide o que fazer com o status de um pagamento de
 * compra de plano, usado tanto pelo webhook quanto pela consulta
 * self-healing (GET /api/planos/[id]). */
export async function aplicarStatusPagamentoPlano(purchase: PlanPurchaseAtual, payment: PaymentResponse) {
  if (purchase.status === "pago") return purchase;

  if (payment.status === "approved") {
    const atualizado = await prisma.planPurchase.update({
      where: { id: purchase.id },
      data: { status: "pago", mpPaymentId: String(payment.id) },
    });
    // Efeito colateral (não bloqueia a confirmação do pagamento em si, que
    // já está salva no banco antes desta linha rodar).
    await enviarEmailLinkCadastro(atualizado).catch((err) =>
      console.error("[planPurchasePayment] falha ao enviar e-mail de link de cadastro", err)
    );
    return atualizado;
  }

  if (payment.status === "rejected" || payment.status === "cancelled") {
    return prisma.planPurchase.update({
      where: { id: purchase.id },
      data: { status: "cancelado", mpPaymentId: String(payment.id) },
    });
  }

  return prisma.planPurchase.update({
    where: { id: purchase.id },
    data: { mpPaymentId: String(payment.id) },
  });
}
