import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mpConfigured, mpPaymentClient } from "@/lib/mercadopago";

// POST /api/webhooks/mercadopago — o Mercado Pago chama essa rota sozinho
// (sem token de usuário nenhum) toda vez que o status de um pagamento
// muda. É aqui que o impulsionamento é liberado de verdade.
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
    const boostId = payment.external_reference;
    if (!boostId) {
      console.error("[webhook mercadopago] pagamento sem external_reference", paymentId);
      return NextResponse.json({ ok: true });
    }

    const boost = await prisma.boost.findUnique({ where: { id: boostId } });
    if (!boost) {
      console.error("[webhook mercadopago] boost não encontrado", boostId);
      return NextResponse.json({ ok: true });
    }

    // Idempotente: o Mercado Pago pode reenviar a mesma notificação várias
    // vezes — se já processamos esse pagamento como pago, não faz nada de novo.
    if (boost.status === "pago") {
      return NextResponse.json({ ok: true });
    }

    if (payment.status === "approved") {
      const agora = new Date();
      const termino = new Date(agora.getTime() + boost.dias * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const ad = await tx.ad.create({
          data: {
            companyId: boost.companyId,
            tipo: boost.tipo,
            inicio: agora,
            termino,
            status: "ativo",
          },
        });
        await tx.boost.update({
          where: { id: boost.id },
          data: {
            status: "pago",
            mpPaymentId: String(payment.id),
            adId: ad.id,
          },
        });
      });
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      await prisma.boost.update({
        where: { id: boost.id },
        data: { status: "cancelado", mpPaymentId: String(payment.id) },
      });
    } else {
      // pending / in_process / etc — ainda não é definitivo (ex: boleto ou
      // Pix aguardando confirmação). Só guarda o ID do pagamento pra a
      // próxima notificação (quando vier) achar o mesmo Boost mais rápido.
      await prisma.boost.update({
        where: { id: boost.id },
        data: { mpPaymentId: String(payment.id) },
      });
    }

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
