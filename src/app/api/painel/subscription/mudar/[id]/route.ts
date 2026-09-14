import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { mpConfigured, mpPaymentClient } from "@/lib/mercadopago";
import { aplicarStatusPagamentoMudancaPlano } from "@/lib/subscriptionChangePayment";

// GET /api/painel/subscription/mudar/[id] — status de uma troca de plano.
// Mesma lógica "self-healing" do Impulsionar/Planos: se ainda está
// "pendente" mas já tem um mpPaymentId salvo, reconsulta direto na API do
// Mercado Pago antes de responder, pra não depender só do webhook.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    let change = await prisma.subscriptionChange.findUnique({ where: { id } });
    if (!change || change.companyId !== auth.companyId) return notFound("Troca de plano não encontrada.");

    if (change.status === "pendente" && change.mpPaymentId && mpConfigured()) {
      try {
        const payment = await mpPaymentClient().get({ id: change.mpPaymentId });
        const atualizado = await aplicarStatusPagamentoMudancaPlano(change, payment);
        if (atualizado) change = atualizado;
      } catch (err) {
        console.error("[GET /api/painel/subscription/mudar/[id]] falha ao reconsultar pagamento", err);
      }
    }

    if (!change) return notFound("Troca de plano não encontrada.");

    return ok({ id: change.id, status: change.status, planoId: change.planoId, periodicidade: change.periodicidade });
  } catch (err) {
    console.error("[GET /api/painel/subscription/mudar/[id]]", err);
    return serverError();
  }
}
