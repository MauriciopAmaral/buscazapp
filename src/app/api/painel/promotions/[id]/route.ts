import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

const statusValidos = ["ativa", "agendada", "expirada", "desativada"];

// PATCH /api/painel/promotions/[id] — edita campos ou muda o status
// (ex: { status: "desativada" } pra pausar).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing || existing.companyId !== auth.companyId) return notFound("Promoção não encontrada.");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const field of ["titulo", "descricao", "imagemUrl"] as const) {
      if (typeof body[field] === "string") data[field] = body[field];
    }
    if (typeof body.inicio === "string") data.inicio = new Date(body.inicio);
    if (typeof body.termino === "string") data.termino = new Date(body.termino);
    if (body.preco !== undefined) data.preco = Number(body.preco);
    if (body.precoPromocional !== undefined) data.precoPromocional = Number(body.precoPromocional);
    if (typeof body.status === "string") {
      if (!statusValidos.includes(body.status)) return badRequest("Status inválido.");
      data.status = body.status;
    }

    if (Object.keys(data).length === 0) return badRequest("Nenhum campo válido pra atualizar.");

    const promotion = await prisma.promotion.update({ where: { id }, data });
    return ok(promotion);
  } catch (err) {
    console.error("[PATCH /api/painel/promotions/[id]]", err);
    return serverError();
  }
}
