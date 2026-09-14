import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { mpConfigured, mpPaymentClient, siteBaseUrl } from "@/lib/mercadopago";
import { aplicarStatusPagamentoMudancaPlano, NOMES_PLANO } from "@/lib/subscriptionChangePayment";

// POST /api/painel/subscription/mudar/[id]/pagar — mesmo padrão do
// Impulsionar/Planos: recebe os dados que o Payment Brick tokenizou no
// navegador (cartão ou Pix) e cria o pagamento de verdade direto na API do
// Mercado Pago, sem sair do painel. O valor cobrado nunca vem do
// navegador — é sempre o que já foi calculado no servidor em
// POST /api/painel/subscription/mudar.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    if (!mpConfigured()) {
      return serverError("Pagamento ainda não foi configurado neste projeto.");
    }

    const { id } = await params;
    const change = await prisma.subscriptionChange.findUnique({ where: { id } });
    if (!change || change.companyId !== auth.companyId) return notFound("Troca de plano não encontrada.");
    if (change.status === "pago") return badRequest("Essa troca de plano já foi paga.");
    if (change.status === "cancelado") {
      return badRequest("Essa troca de plano foi cancelada — comece de novo pra tentar outra vez.");
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

    const nomePlano = NOMES_PLANO[change.planoId] ?? change.planoId;
    const base = siteBaseUrl();

    const company = await prisma.company.findUnique({ where: { id: auth.companyId }, select: { email: true } });

    const payment = await mpPaymentClient().create({
      body: {
        transaction_amount: Number(change.valor),
        description: `Assinatura ${nomePlano} (${change.periodicidade}) — BuscaZapp`,
        payment_method_id: paymentMethodId,
        token,
        installments: isCartao ? Number(body.installments) || 1 : undefined,
        issuer_id:
          typeof body.issuer_id === "string" || typeof body.issuer_id === "number" ? body.issuer_id : undefined,
        payer: {
          email: typeof body.payer?.email === "string" ? body.payer.email : company?.email || undefined,
          identification: body.payer?.identification
            ? { type: body.payer.identification.type, number: body.payer.identification.number }
            : undefined,
        },
        external_reference: change.id,
        notification_url: `${base}/api/webhooks/mercadopago`,
        statement_descriptor: "BUSCAZAPP",
      },
    });

    const atualizado = await aplicarStatusPagamentoMudancaPlano(change, payment);

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
    });
  } catch (err) {
    const mp = err as { status?: number; message?: string; error?: string; causes?: unknown };
    console.error("[POST /api/painel/subscription/mudar/[id]/pagar]", {
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
