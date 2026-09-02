import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";
import { NextRequest } from "next/server";

// GET /api/admin/promotions — todas as promoções, de todas as empresas,
// pro admin gerenciar (a rota pública só traz as "ativa").
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const rows = await prisma.promotion.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: { select: { nomeFantasia: true, slug: true } } },
    });

    return ok(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      rows.map((p: any) => ({
        id: p.id,
        companyId: p.companyId,
        companyNome: p.company.nomeFantasia,
        companySlug: p.company.slug,
        titulo: p.titulo,
        descricao: p.descricao,
        imagemUrl: p.imagemUrl ?? "",
        inicio: p.inicio instanceof Date ? p.inicio.toISOString() : String(p.inicio),
        termino: p.termino instanceof Date ? p.termino.toISOString() : String(p.termino),
        preco: Number(p.preco),
        precoPromocional: Number(p.precoPromocional),
        status: p.status,
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/promotions]", err);
    return serverError();
  }
}
