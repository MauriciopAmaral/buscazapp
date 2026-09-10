import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok, serverError } from "@/lib/apiResponse";
import { mpConfigured, mpPaymentClient, siteBaseUrl } from "@/lib/mercadopago";
import { aplicarStatusPagamentoPlano } from "@/lib/planPurchasePayment";

const NOMES_PLANO: Record<string, string> = {
  gratuito: "Gratuito",
  pro: "Pro",
  premium: "Premium",
  premium_plus: "Premium+",
};

// POST /api/planos/[id]/pagar — mesmo padrão do Impulsionar
// (POST /api/painel/boosts/[id]/pagar): recebe os dados que o Payment
// Brick tokenizou no navegador (cartão ou Pix) e cria o pagamento de
// verdade direto na API do Mercado Pago, sem sair do site. Pública (sem
// login), mas o valor cobrado nunca vem do navegador — é sempre o que já
// foi calculado no servidor em POST /api/planos/comprar.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!mpConfigured()) {
      return serverError("Pagamento ainda não foi configurado neste projeto.");
    }

    const { id } = await params;
    const purchase = await prisma.planPurchase.findUnique({ where: { id } });
    if (!purchase) return notFound("Compra não encontrada.");
    if (purchase.status === "pago") return badRequest("Esse plano já foi pago.");
    if (purchase.status === "cancelado") {
      return badRequest("Essa compra foi cancelada — recomece pra tentar de novo.");
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Dados de pagamento inválidos.");

    const paymentMethodId = typeof body.payment_method_id === "string" ? body.payment_method_id : "";
    const token = typeof body.token === "string" ? body.token : undefined;
    const isPix = paymentMethodId === "pix";
    const isCartao = Boolean(token) && paymentMethodId !== "pix";

    if (!isPix && !isCartao) {
      return badRequest("Só aceitamos pagamento por cartão de crédito ou Pix.");
    }

    const nomePlano = NOMES_PLANO[purchase.planoId] ?? purchase.planoId;
    const base = siteBaseUrl();

    const payment = await mpPaymentClient().create({
      body: {
        transaction_amount: Number(purchase.valor),
        description: `Plano ${nomePlano} (${purchase.periodicidade}) — BuscaZapp`,
        payment_method_id: paymentMethodId,
        token,
        installments: isCartao ? Number(body.installments) || 1 : undefined,
        issuer_id:
          typeof body.issuer_id === "string" || typeof body.issuer_id === "number" ? body.issuer_id : undefined,
        payer: {
          email: purchase.email,
          identification: body.payer?.identification
            ? { type: body.payer.identification.type, number: body.payer.identification.number }
            : undefined,
        },
        external_reference: purchase.id,
        notification_url: `${base}/api/webhooks/mercadopago`,
        statement_descriptor: "BUSCAZAPP",
      },
    });

    const atualizado = await aplicarStatusPagamentoPlano(purchase, payment);

    return ok({
      status: atualizado?.status ?? "pendente",
      paymentStatus: payment.status,
      paymentStatusDetail: payment.status_detail,
      pix:
        isPix && payment.point_of_interaction?.transaction_data
          ? {
              qrCode: payment.point_of_interaction.transaction_data.qr_code ?? null,
              qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64 ?? null,
            }
          : null,
      cadastroToken: atualizado?.status === "pago" ? atualizado.cadastroToken : null,
    });
  } catch (err) {
    const mp = err as { status?: number; message?: string; error?: string; causes?: unknown };
    console.error("[POST /api/planos/[id]/pagar]", {
      status: mp?.status,
      message: mp?.message,
      error: mp?.error,
      causes: mp?.causes,
      raw: err,
    });
    const detalhe = mp?.message ? ` (${mp.message})` : "";
    return serverError(`Não foi possível processar o pagamento. Tente novamente em instantes.${detalhe}`);
  }
}
