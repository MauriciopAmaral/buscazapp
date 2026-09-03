import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/ads — todos os anúncios/campanhas patrocinadas, de todas
// as empresas, pro admin gerenciar.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const rows = await prisma.ad.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: { select: { nomeFantasia: true, slug: true, cidadeNome: true } } },
    });

    return ok(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      rows.map((a: any) => ({
        id: a.id,
        tipo: a.tipo,
        companyId: a.companyId,
        companyNome: a.company.nomeFantasia,
        companySlug: a.company.slug,
        cidade: a.company.cidadeNome,
        inicio: a.inicio instanceof Date ? a.inicio.toISOString() : String(a.inicio),
        termino: a.termino instanceof Date ? a.termino.toISOString() : String(a.termino),
        status: a.status,
        cliques: a.cliques,
        impressoes: a.impressoes,
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/ads]", err);
    return serverError();
  }
}
