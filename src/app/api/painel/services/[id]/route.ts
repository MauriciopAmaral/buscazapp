import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// PATCH /api/painel/services/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing || existing.companyId !== auth.companyId) return notFound("Serviço não encontrado.");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const field of ["nome", "descricao", "imagemUrl"] as const) {
      if (typeof body[field] === "string") data[field] = body[field];
    }
    if (typeof body.precoInicial === "number" || (typeof body.precoInicial === "string" && body.precoInicial !== "")) {
      data.precoInicial = Number(body.precoInicial);
    }

    if (Object.keys(data).length === 0) return badRequest("Nenhum campo válido pra atualizar.");

    const service = await prisma.service.update({ where: { id }, data });
    return ok(service);
  } catch (err) {
    console.error("[PATCH /api/painel/services/[id]]", err);
    return serverError();
  }
}

// DELETE /api/painel/services/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing || existing.companyId !== auth.companyId) return notFound("Serviço não encontrado.");

    await prisma.service.delete({ where: { id } });
    return ok({ id });
  } catch (err) {
    console.error("[DELETE /api/painel/services/[id]]", err);
    return serverError();
  }
}
