import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { mpConfigured, mpPaymentClient } from "@/lib/mercadopago";
import { aplicarStatusPagamento } from "@/lib/boostPayment";

// GET /api/painel/boosts/[id] — status de um impulsionamento específico.
// Usado pela tela do Impulsionar (enquanto tem um Pix aguardando
// pagamento) pra saber se já foi confirmado.
//
// Não depende só do webhook ter chegado: se o Boost ainda está
// "pendente" mas já tem um pagamento do Mercado Pago associado
// (mpPaymentId — salvo assim que o Pix é criado), essa rota também
// consulta o status direto na API do Mercado Pago e já atualiza o Boost
// na hora, antes de responder. Isso evita ficar preso em "aguardando
// pagamento" pra sempre se o webhook atrasar, falhar ou nunca chegar
// (ex: URL de notificação não configurada, instabilidade momentânea).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    let boost = await prisma.boost.findUnique({ where: { id }, include: { ad: true } });
    if (!boost || boost.companyId !== auth.companyId) return notFound("Impulsionamento não encontrado.");

    if (boost.status === "pendente" && boost.mpPaymentId && mpConfigured()) {
      try {
        const payment = await mpPaymentClient().get({ id: boost.mpPaymentId });
        const atualizado = await aplicarStatusPagamento(boost, payment);
        if (atualizado) boost = atualizado;
      } catch (err) {
        // Se a consulta ao Mercado Pago falhar por qualquer motivo, não
        // derruba a tela — só devolve o status que já tínhamos salvo e
        // tenta de novo na próxima consulta (a tela insiste a cada 3s).
        console.error("[GET /api/painel/boosts/[id]] falha ao reconsultar pagamento", err);
      }
    }

    return ok(boost);
  } catch (err) {
    console.error("[GET /api/painel/boosts/[id]]", err);
    return serverError();
  }
}
