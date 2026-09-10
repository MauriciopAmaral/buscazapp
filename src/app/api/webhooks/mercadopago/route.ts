import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mpConfigured, mpPaymentClient } from "@/lib/mercadopago";
import { aplicarStatusPagamento } from "@/lib/boostPayment";
import { aplicarStatusPagamentoPlano } from "@/lib/planPurchasePayment";

// POST /api/webhooks/mercadopago — o Mercado Pago chama essa rota sozinho
// (sem token de usuário nenhum) toda vez que o status de um pagamento
// muda. É o que confirma o Pix depois que a pessoa paga (o pagamento por
// cartão já costuma ser confirmado na hora, direto na resposta de
// POST /api/painel/boosts/[id]/pagar — esse webhook é o backup que
// garante a liberação mesmo se a pessoa fechar a aba antes da confirmação
// chegar, e é a única forma de saber quando um Pix pendente é pago).
//
// Segurança: em vez de confiar em qualquer coisa que vier no corpo da
// notificação (que poderia ser forjado por qualquer um, já que essa rota
// não tem autenticação de usuário), a gente pega só o ID do pagamento
// avisado e busca o pagamento de novo direto na API do Mercado Pago, com
// o nosso Access Token — só o Mercado Pago sabe responder "aprovado" pra
// um ID de pagamento real, então isso já impede alguém forjar uma
// aprovação chamando essa URL manualmente.
//
// Sempre responde 200 (mesmo quando não há nada a fazer), porque um
// status de erro faz o Mercado Pago tentar de novo repetidamente — e
// isso é intencional só quando um erro realmente inesperado acontece.
export async function POST(request: NextRequest) {
  try {
    if (!mpConfigured()) {
      console.error("[webhook mercadopago] MP_ACCESS_TOKEN não configurado — notificação ignorada.");
      return NextResponse.json({ ok: true });
    }

    const url = new URL(request.url);
    const body = await request.json().catch(() => null);

    const tipo = body?.type ?? body?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
    const paymentId =
      body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? null;

    if (tipo !== "payment" || !paymentId) {
      // Outros tipos de notificação (ex: merchant_order) não interessam pro Impulsionar.
      return NextResponse.json({ ok: true });
    }

    const payment = await mpPaymentClient().get({ id: String(paymentId) });
    const externalReference = payment.external_reference;
    if (!externalReference) {
      console.error("[webhook mercadopago] pagamento sem external_reference", paymentId);
      return NextResponse.json({ ok: true });
    }

    // O `external_reference` pode ser de um Impulsionamento (Boost) OU de
    // uma compra de plano (PlanPurchase, pago na página pública "Para
    // empresas" → Planos) — os dois usam essa mesma URL de webhook. Tenta
    // achar em qualquer uma das duas tabelas.
    const boost = await prisma.boost.findUnique({ where: { id: externalReference } });
    if (boost) {
      // aplicarStatusPagamento já é idempotente (não faz nada se o Boost já
      // estiver "pago") — o Mercado Pago pode reenviar a mesma notificação
      // várias vezes.
      await aplicarStatusPagamento(boost, payment);
      return NextResponse.json({ ok: true });
    }

    const purchase = await prisma.planPurchase.findUnique({ where: { id: externalReference } });
    if (purchase) {
      await aplicarStatusPagamentoPlano(purchase, payment);
      return NextResponse.json({ ok: true });
    }

    console.error("[webhook mercadopago] nenhum Boost/PlanPurchase encontrado", externalReference);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/webhooks/mercadopago]", err);
    // Aqui sim retorna erro: se algo inesperado quebrou, é melhor o
    // Mercado Pago tentar reenviar a notificação depois.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// O Mercado Pago também pode fazer uma checagem simples via GET ao
// cadastrar a URL do webhook no painel — responde OK pra essa checagem.
export async function GET() {
  return NextResponse.json({ ok: true });
}
