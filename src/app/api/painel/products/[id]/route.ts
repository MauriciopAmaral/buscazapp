import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

const editableFields = ["nome", "descricao", "imagemUrl"] as const;

// PATCH /api/painel/products/[id] — atualiza um produto da empresa logada.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.companyId !== auth.companyId) return notFound("Produto não encontrado.");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const field of editableFields) {
      if (typeof body[field] === "string") data[field] = body[field];
    }
    if (typeof body.preco === "number" || (typeof body.preco === "string" && body.preco !== "")) {
      data.preco = Number(body.preco);
    }
    if ("precoPromocional" in body) {
      data.precoPromocional =
        body.precoPromocional === null || body.precoPromocional === "" ? null : Number(body.precoPromocional);
    }
    if (typeof body.ativo === "boolean") data.ativo = body.ativo;

    if (Object.keys(data).length === 0) return badRequest("Nenhum campo válido pra atualizar.");

    const product = await prisma.product.update({ where: { id }, data });
    return ok(product);
  } catch (err) {
    console.error("[PATCH /api/painel/products/[id]]", err);
    return serverError();
  }
}

// DELETE /api/painel/products/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.companyId !== auth.companyId) return notFound("Produto não encontrado.");

    await prisma.product.delete({ where: { id } });
    return ok({ id });
  } catch (err) {
    console.error("[DELETE /api/painel/products/[id]]", err);
    return serverError();
  }
}
