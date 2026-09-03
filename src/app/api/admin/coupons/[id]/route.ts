import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

const STATUS_VALIDOS = ["ativo", "expirado", "utilizado", "desativado"] as const;

// PATCH /api/admin/coupons/[id] — admin muda o status de um cupom (ex:
// desativar um cupom abusivo ou fora do combinado). Body: { status }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.coupon.findUnique({ where: { id } });
    if (!existente) return notFound("Cupom não encontrado.");

    const body = await request.json().catch(() => null);
    if (typeof body?.status !== "string" || !STATUS_VALIDOS.includes(body.status as (typeof STATUS_VALIDOS)[number])) {
      return badRequest("Status inválido.");
    }

    const cupom = await prisma.coupon.update({
      where: { id },
      data: { status: body.status },
      include: { company: { select: { nomeFantasia: true, slug: true } } },
    });

    return ok({
      id: cupom.id,
      companyId: cupom.companyId,
      companyNome: cupom.company.nomeFantasia,
      companySlug: cupom.company.slug,
      titulo: cupom.titulo,
      descricao: cupom.descricao,
      codigo: cupom.codigo,
      desconto: cupom.desconto,
      validade: cupom.validade.toISOString(),
      limite: cupom.limite,
      utilizados: cupom.utilizados,
      status: cupom.status,
      exclusivoClube: cupom.exclusivoClube,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/coupons/[id]]", err);
    return serverError();
  }
}

// DELETE /api/admin/coupons/[id] — remove o cupom definitivamente.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.coupon.findUnique({ where: { id } });
    if (!existente) return notFound("Cupom não encontrado.");

    await prisma.coupon.delete({ where: { id } });
    return ok({ excluido: true });
  } catch (err) {
    console.error("[DELETE /api/admin/coupons/[id]]", err);
    return serverError();
  }
}
