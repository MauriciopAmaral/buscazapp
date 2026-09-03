import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

const STATUS_VALIDOS = ["ativa", "cancelada", "atrasada"] as const;

// PATCH /api/admin/subscriptions/[id] — admin muda o status de uma
// assinatura (ex: cancelar manualmente, ou reativar). Body: { status }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.subscription.findUnique({ where: { id } });
    if (!existente) return notFound("Assinatura não encontrada.");

    const body = await request.json().catch(() => null);
    if (typeof body?.status !== "string" || !STATUS_VALIDOS.includes(body.status as (typeof STATUS_VALIDOS)[number])) {
      return badRequest("Status inválido.");
    }

    const [assinatura, planos] = await Promise.all([
      prisma.subscription.update({
        where: { id },
        data: { status: body.status },
        include: { company: { select: { nomeFantasia: true, slug: true } } },
      }),
      prisma.plan.findMany({ select: { id: true, nome: true } }),
    ]);
    const nomePorPlano = new Map(planos.map((p) => [p.id, p.nome]));

    return ok({
      id: assinatura.id,
      companyId: assinatura.companyId,
      companyNome: assinatura.company.nomeFantasia,
      companySlug: assinatura.company.slug,
      planoId: assinatura.planoId,
      planoNome: nomePorPlano.get(assinatura.planoId) ?? assinatura.planoId,
      periodicidade: assinatura.periodicidade,
      status: assinatura.status,
      proximaCobranca: assinatura.proximaCobranca.toISOString(),
      valor: Number(assinatura.valor),
    });
  } catch (err) {
    console.error("[PATCH /api/admin/subscriptions/[id]]", err);
    return serverError();
  }
}

// DELETE /api/admin/subscriptions/[id] — remove o registro de assinatura
// (não mexe no plano da empresa em si, `Company.planoId` — só some da
// lista de cobranças).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.subscription.findUnique({ where: { id } });
    if (!existente) return notFound("Assinatura não encontrada.");

    await prisma.subscription.delete({ where: { id } });
    return ok({ excluida: true });
  } catch (err) {
    console.error("[DELETE /api/admin/subscriptions/[id]]", err);
    return serverError();
  }
}
