import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/users — lista todas as contas cadastradas na plataforma.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: { select: { nomeFantasia: true, slug: true } } },
    });

    return ok(
      users.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        avatarUrl: u.avatarUrl ?? undefined,
        role: u.role,
        companyId: u.companyId ?? undefined,
        companyNome: u.company?.nomeFantasia,
        companySlug: u.company?.slug,
        clubeAssinante: u.clubeAssinante,
        criadoEm: u.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    return serverError();
  }
}
