import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// PATCH /api/admin/users/[id] — ferramenta de suporte do admin: trocar o
// papel (role) de uma conta e/ou vincular/desvincular ela de uma empresa
// (útil quando uma reivindicação precisa ser corrigida manualmente).
// Body aceita qualquer subconjunto de: { role, companyId }
// companyId: "" ou null pra desvincular.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return notFound("Usuário não encontrado.");

    const data: { role?: "consumidor" | "empresa" | "admin"; companyId?: string | null } = {};

    if (typeof body.role === "string") {
      if (!["consumidor", "empresa", "admin"].includes(body.role)) {
        return badRequest("Papel inválido.");
      }
      data.role = body.role;
    }

    if ("companyId" in body) {
      const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
      if (!companyId) {
        data.companyId = null;
      } else {
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return badRequest("Empresa não encontrada.");
        data.companyId = companyId;
      }
    }

    if (Object.keys(data).length === 0) {
      return badRequest("Nenhum campo válido pra atualizar.");
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { company: { select: { nomeFantasia: true, slug: true } } },
    });

    return ok({
      id: user.id,
      nome: user.nome,
      email: user.email,
      avatarUrl: user.avatarUrl ?? undefined,
      role: user.role,
      companyId: user.companyId ?? undefined,
      companyNome: user.company?.nomeFantasia,
      companySlug: user.company?.slug,
      clubeAssinante: user.clubeAssinante,
      criadoEm: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]]", err);
    return serverError();
  }
}
