import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { BOOST_CATALOGO, BoostTipo } from "@/lib/boostCatalog";
import { mpConfigured, mpPaymentClient, siteBaseUrl } from "@/lib/mercadopago";
import { aplicarStatusPagamento } from "@/lib/boostPayment";

// POST /api/painel/boosts/[id]/pagar — recebe os dados que o Payment
// Brick do Mercado Pago tokenizou no navegador (cartão de crédito) ou
// montou pro Pix, e cria o pagamento de verdade direto na API do Mercado
// Pago, sem a empresa sair do BuscaZapp em nenhum momento.
//
// Só aceita cartão de crédito (tem "token") ou Pix ("payment_method_id"
// = "pix") — o Payment Brick já vem configurado só com essas duas opções,
// mas o servidor também recusa qualquer outra coisa por segurança.
//
// O valor cobrado NUNCA vem do navegador: é sempre recalculado a partir
// do Boost que já foi criado (com o preço do catálogo do servidor) em
// POST /api/painel/boosts.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    if (!mpConfigured()) {
      return serverError("Pagamento ainda não foi configurado neste projeto.");
    }

    const { id } = await params;
    const boost = await prisma.boost.findUnique({ where: { id } });
    if (!boost || boost.companyId !== auth.companyId) return notFound("Impulsionamento não encontrado.");
    if (boost.status === "pago") return badRequest("Esse impulsionamento já foi pago.");
    if (boost.status === "cancelado") {
      return badRequest("Esse impulsionamento foi cancelado — crie um novo pra tentar de novo.");
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Dados de pagamento inválidos.");

    const paymentMethodId = typeof body.payment_method_id === "string" ? body.payment_method_id : "";
    const token = typeof body.token === "string" ? body.token : undefined;
    const isPix = paymentMethodId === "pix";
    const isCartao = Boolean(token) && paymentMethodId !== "pix";

    // Só aceita cartão de crédito ou Pix — recusa boleto e qualquer outro
    // meio, mesmo que alguém tente chamar essa rota manualmente.
    if (!isPix && !isCartao) {
      return badRequest("Só aceitamos pagamento por cartão de crédito ou Pix.");
    }

    const catalogo = BOOST_CATALOGO[boost.tipo as BoostTipo];
    const base = siteBaseUrl();

    const payment = await mpPaymentClient().create({
      body: {
        transaction_amount: Number(boost.valor),
        description: `Impulsionamento — ${catalogo.nome} (${boost.dias} dias)`,
        payment_method_id: paymentMethodId,
        token,
        installments: isCartao ? Number(body.installments) || 1 : undefined,
        issuer_id: typeof body.issuer_id === "string" || typeof body.issuer_id === "number" ? body.issuer_id : undefined,
        payer: {
          email: typeof body.payer?.email === "string" ? body.payer.email : undefined,
          identification: body.payer?.identification
            ? {
                type: body.payer.identification.type,
                number: body.payer.identification.number,
              }
            : undefined,
        },
        external_reference: boost.id,
        notification_url: `${base}/api/webhooks/mercadopago`,
        statement_descriptor: "BUSCAZAPP",
      },
    });

    const atualizado = await aplicarStatusPagamento(boost, payment);

    // Pra tela mostrar QR code do Pix (quando pendente) ou o resultado do
    // cartão na hora, sem precisar de outra requisição.
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
      ad: atualizado?.ad ? { termino: atualizado.ad.termino } : null,
    });
  } catch (err) {
    const mp = err as { status?: number; message?: string; error?: string; causes?: unknown };
    console.error("[POST /api/painel/boosts/[id]/pagar]", {
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
