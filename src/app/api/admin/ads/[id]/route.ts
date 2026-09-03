import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

const STATUS_VALIDOS = ["ativo", "pausado", "encerrado"] as const;

// PATCH /api/admin/ads/[id] — admin muda o status de um anúncio (ex:
// pausar uma campanha, ou reativar). Body: { status }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.ad.findUnique({ where: { id } });
    if (!existente) return notFound("Anúncio não encontrado.");

    const body = await request.json().catch(() => null);
    if (typeof body?.status !== "string" || !STATUS_VALIDOS.includes(body.status as (typeof STATUS_VALIDOS)[number])) {
      return badRequest("Status inválido.");
    }

    const anuncio = await prisma.ad.update({
      where: { id },
      data: { status: body.status },
      include: { company: { select: { nomeFantasia: true, slug: true, cidadeNome: true } } },
    });

    return ok({
      id: anuncio.id,
      tipo: anuncio.tipo,
      companyId: anuncio.companyId,
      companyNome: anuncio.company.nomeFantasia,
      companySlug: anuncio.company.slug,
      cidade: anuncio.company.cidadeNome,
      inicio: anuncio.inicio.toISOString(),
      termino: anuncio.termino.toISOString(),
      status: anuncio.status,
      cliques: anuncio.cliques,
      impressoes: anuncio.impressoes,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/ads/[id]]", err);
    return serverError();
  }
}

// DELETE /api/admin/ads/[id] — remove o anúncio definitivamente.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.ad.findUnique({ where: { id } });
    if (!existente) return notFound("Anúncio não encontrado.");

    await prisma.ad.delete({ where: { id } });
    return ok({ excluido: true });
  } catch (err) {
    console.error("[DELETE /api/admin/ads/[id]]", err);
    return serverError();
  }
}
