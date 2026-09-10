import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { BOOST_CATALOGO, formatDias, type BoostTipo } from "@/lib/boostCatalog";

const STATUS_VALIDOS = ["pago", "pendente", "falhou"] as const;
type StatusPayment = (typeof STATUS_VALIDOS)[number];

const NOMES_PLANO: Record<string, string> = {
  gratuito: "Gratuito",
  pro: "Pro",
  premium: "Premium",
  premium_plus: "Premium+",
};

// Boost e PlanPurchase são listados aqui com um id prefixado ("boost-xxx" /
// "plano-xxx" — ver GET /api/admin/payments) porque não são registros da
// tabela `Payment`. "falhou" (o único status que essa tela conhece pra
// "não é dinheiro recebido") vira "cancelado" nessas duas tabelas, que não
// têm um status próprio equivalente.
function statusPaymentParaBoost(status: StatusPayment): "pago" | "pendente" | "cancelado" {
  return status === "falhou" ? "cancelado" : status;
}

// PATCH /api/admin/payments/[id] — admin corrige o status de um pagamento
// manualmente (ex: conciliar um pagamento que caiu na conta mas ficou
// como pendente). Body: { status }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (typeof body?.status !== "string" || !STATUS_VALIDOS.includes(body.status as StatusPayment)) {
      return badRequest("Status inválido.");
    }
    const status = body.status as StatusPayment;

    if (id.startsWith("boost-")) {
      const boostId = id.slice("boost-".length);
      const existente = await prisma.boost.findUnique({ where: { id: boostId } });
      if (!existente) return notFound("Impulsionamento não encontrado.");
      const boost = await prisma.boost.update({
        where: { id: boostId },
        data: { status: statusPaymentParaBoost(status) },
        include: { company: { select: { nomeFantasia: true, slug: true, whatsapp: true } } },
      });
      return ok({
        id: `boost-${boost.id}`,
        companyId: boost.companyId,
        companyNome: boost.company.nomeFantasia,
        companySlug: boost.company.slug,
        companyWhatsapp: boost.company.whatsapp,
        descricao: `Impulsionar — ${BOOST_CATALOGO[boost.tipo as BoostTipo]?.nome ?? boost.tipo} (${formatDias(boost.dias)})`,
        data: boost.createdAt.toISOString(),
        valor: Number(boost.valor),
        status,
      });
    }

    if (id.startsWith("plano-")) {
      const purchaseId = id.slice("plano-".length);
      const existente = await prisma.planPurchase.findUnique({ where: { id: purchaseId } });
      if (!existente) return notFound("Compra de plano não encontrada.");
      const purchase = await prisma.planPurchase.update({
        where: { id: purchaseId },
        data: { status: statusPaymentParaBoost(status) },
      });
      return ok({
        id: `plano-${purchase.id}`,
        companyId: purchase.companyId,
        companyNome: purchase.nome,
        companySlug: null,
        companyWhatsapp: purchase.telefone ?? null,
        descricao: `Assinatura — ${NOMES_PLANO[purchase.planoId] ?? purchase.planoId} (${purchase.periodicidade})${purchase.companyId ? "" : " — cadastro pendente"}`,
        data: purchase.createdAt.toISOString(),
        valor: Number(purchase.valor),
        status,
      });
    }

    const existente = await prisma.payment.findUnique({ where: { id } });
    if (!existente) return notFound("Pagamento não encontrado.");

    const pagamento = await prisma.payment.update({
      where: { id },
      data: { status },
      include: { company: { select: { nomeFantasia: true, slug: true, whatsapp: true } } },
    });

    return ok({
      id: pagamento.id,
      companyId: pagamento.companyId,
      companyNome: pagamento.company.nomeFantasia,
      companySlug: pagamento.company.slug,
      companyWhatsapp: pagamento.company.whatsapp,
      descricao: pagamento.descricao,
      data: pagamento.data.toISOString(),
      valor: Number(pagamento.valor),
      status: pagamento.status,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/payments/[id]]", err);
    return serverError();
  }
}

// DELETE /api/admin/payments/[id] — remove um lançamento errado.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;

    if (id.startsWith("boost-")) {
      const boostId = id.slice("boost-".length);
      const existente = await prisma.boost.findUnique({ where: { id: boostId } });
      if (!existente) return notFound("Impulsionamento não encontrado.");
      await prisma.boost.delete({ where: { id: boostId } });
      return ok({ excluido: true });
    }

    if (id.startsWith("plano-")) {
      const purchaseId = id.slice("plano-".length);
      const existente = await prisma.planPurchase.findUnique({ where: { id: purchaseId } });
      if (!existente) return notFound("Compra de plano não encontrada.");
      await prisma.planPurchase.delete({ where: { id: purchaseId } });
      return ok({ excluido: true });
    }

    const existente = await prisma.payment.findUnique({ where: { id } });
    if (!existente) return notFound("Pagamento não encontrado.");

    await prisma.payment.delete({ where: { id } });
    return ok({ excluido: true });
  } catch (err) {
    console.error("[DELETE /api/admin/payments/[id]]", err);
    return serverError();
  }
}
