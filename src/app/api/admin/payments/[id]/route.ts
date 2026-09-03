import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

const STATUS_VALIDOS = ["pago", "pendente", "falhou"] as const;

// PATCH /api/admin/payments/[id] — admin corrige o status de um pagamento
// manualmente (ex: conciliar um pagamento que caiu na conta mas ficou
// como pendente). Body: { status }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.payment.findUnique({ where: { id } });
    if (!existente) return notFound("Pagamento não encontrado.");

    const body = await request.json().catch(() => null);
    if (typeof body?.status !== "string" || !STATUS_VALIDOS.includes(body.status as (typeof STATUS_VALIDOS)[number])) {
      return badRequest("Status inválido.");
    }

    const pagamento = await prisma.payment.update({
      where: { id },
      data: { status: body.status },
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
    const existente = await prisma.payment.findUnique({ where: { id } });
    if (!existente) return notFound("Pagamento não encontrado.");

    await prisma.payment.delete({ where: { id } });
    return ok({ excluido: true });
  } catch (err) {
    console.error("[DELETE /api/admin/payments/[id]]", err);
    return serverError();
  }
}
