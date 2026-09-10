import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok, serverError } from "@/lib/apiResponse";
import { mpConfigured, mpPaymentClient } from "@/lib/mercadopago";
import { aplicarStatusPagamentoPlano } from "@/lib/planPurchasePayment";

// GET /api/planos/[id] — status de uma compra de plano. Pública (sem
// login — quem compra ainda não tem conta), usada pela tela de checkout
// pra saber se um Pix pendente já foi confirmado. Mesma lógica
// "self-healing" do Impulsionar (GET /api/painel/boosts/[id]): se ainda
// está "pendente" mas já tem um mpPaymentId salvo, reconsulta direto na
// API do Mercado Pago antes de responder, pra não depender só do webhook.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let purchase = await prisma.planPurchase.findUnique({ where: { id } });
    if (!purchase) return notFound("Compra não encontrada.");

    if (purchase.status === "pendente" && purchase.mpPaymentId && mpConfigured()) {
      try {
        const payment = await mpPaymentClient().get({ id: purchase.mpPaymentId });
        const atualizado = await aplicarStatusPagamentoPlano(purchase, payment);
        if (atualizado) purchase = atualizado;
      } catch (err) {
        console.error("[GET /api/planos/[id]] falha ao reconsultar pagamento", err);
      }
    }

    // Reafirma pro TypeScript que `purchase` continua não-nulo depois do
    // bloco acima — como `aplicarStatusPagamentoPlano` foi tipado com
    // `any` (só existe tipo real do Prisma depois de `prisma generate`,
    // que este sandbox não roda — ver AGENTS.md), a reatribuição
    // `purchase = atualizado` faz o TypeScript "esquecer" a checagem de
    // não-nulo já feita ali em cima quando o projeto builda na Vercel
    // (lá sim com o client gerado de verdade e checagem estrita).
    if (!purchase) return notFound("Compra não encontrada.");

    return ok({
      id: purchase.id,
      status: purchase.status,
      planoId: purchase.planoId,
      periodicidade: purchase.periodicidade,
      valor: Number(purchase.valor),
      email: purchase.email,
      cadastroToken: purchase.status === "pago" ? purchase.cadastroToken : undefined,
    });
  } catch (err) {
    console.error("[GET /api/planos/[id]]", err);
    return serverError();
  }
}
