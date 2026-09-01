import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/claims — todas as reivindicações, mais recentes primeiro.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem ver reivindicações.");

    const claims = await prisma.claim.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { nomeFantasia: true, slug: true } },
        user: { select: { nome: true, email: true } },
      },
    });

    return ok(
      claims.map((c) => ({
        id: c.id,
        companyId: c.companyId,
        companyNome: c.company.nomeFantasia,
        companySlug: c.company.slug,
        usuario: c.user?.nome ?? c.user?.email ?? "—",
        metodo: c.metodo,
        status: c.status,
        data: c.createdAt,
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/claims]", err);
    return serverError();
  }
}
