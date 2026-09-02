import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

const STATUS_VALIDOS = ["ativa", "agendada", "expirada", "desativada"] as const;

// PATCH /api/admin/promotions/[id] — admin muda o status de uma promoção
// (ex: desativar uma promoção abusiva ou fora do combinado).
// Body: { status }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.promotion.findUnique({ where: { id } });
    if (!existente) return notFound("Promoção não encontrada.");

    const body = await request.json().catch(() => null);
    if (typeof body?.status !== "string" || !STATUS_VALIDOS.includes(body.status as (typeof STATUS_VALIDOS)[number])) {
      return badRequest("Status inválido.");
    }

    const promocao = await prisma.promotion.update({
      where: { id },
      data: { status: body.status },
      include: { company: { select: { nomeFantasia: true, slug: true } } },
    });

    return ok({
      id: promocao.id,
      companyId: promocao.companyId,
      companyNome: promocao.company.nomeFantasia,
      companySlug: promocao.company.slug,
      titulo: promocao.titulo,
      descricao: promocao.descricao,
      imagemUrl: promocao.imagemUrl ?? "",
      inicio: promocao.inicio.toISOString(),
      termino: promocao.termino.toISOString(),
      preco: Number(promocao.preco),
      precoPromocional: Number(promocao.precoPromocional),
      status: promocao.status,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/promotions/[id]]", err);
    return serverError();
  }
}

// DELETE /api/admin/promotions/[id] — remove a promoção definitivamente.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.promotion.findUnique({ where: { id } });
    if (!existente) return notFound("Promoção não encontrada.");

    await prisma.promotion.delete({ where: { id } });
    return ok({ excluida: true });
  } catch (err) {
    console.error("[DELETE /api/admin/promotions/[id]]", err);
    return serverError();
  }
}
