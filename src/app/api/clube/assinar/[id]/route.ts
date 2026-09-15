import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { mpConfigured, mpPaymentClient } from "@/lib/mercadopago";
import { aplicarStatusPagamentoClube } from "@/lib/clubPayment";

// GET /api/clube/assinar/[id] — status de uma assinatura/renovação do
// Clube. Mesma lógica "self-healing" do Impulsionar/Planos/Assinatura de
// empresa: se ainda está "pendente" mas já tem um mpPaymentId salvo,
// reconsulta direto na API do Mercado Pago antes de responder, pra não
// depender só do webhook.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized("Faça login pra ver o status da assinatura.");

    const { id } = await params;
    let purchase = await prisma.clubPurchase.findUnique({ where: { id } });
    if (!purchase || purchase.userId !== auth.sub) return notFound("Assinatura não encontrada.");

    if (purchase.status === "pendente" && purchase.mpPaymentId && mpConfigured()) {
      try {
        const payment = await mpPaymentClient().get({ id: purchase.mpPaymentId });
        const atualizado = await aplicarStatusPagamentoClube(purchase, payment);
        if (atualizado) purchase = atualizado;
      } catch (err) {
        console.error("[GET /api/clube/assinar/[id]] falha ao reconsultar pagamento", err);
      }
    }

    if (!purchase) return notFound("Assinatura não encontrada.");

    return ok({ id: purchase.id, status: purchase.status, valor: Number(purchase.valor) });
  } catch (err) {
    console.error("[GET /api/clube/assinar/[id]]", err);
    return serverError();
  }
}
