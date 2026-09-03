import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/coupons — todos os cupons, de todas as empresas, pro
// admin gerenciar (a rota pública só traz os "ativo").
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const rows = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: { select: { nomeFantasia: true, slug: true } } },
    });

    return ok(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      rows.map((c: any) => ({
        id: c.id,
        companyId: c.companyId,
        companyNome: c.company.nomeFantasia,
        companySlug: c.company.slug,
        titulo: c.titulo,
        descricao: c.descricao,
        codigo: c.codigo,
        desconto: c.desconto,
        validade: c.validade instanceof Date ? c.validade.toISOString() : String(c.validade),
        limite: c.limite,
        utilizados: c.utilizados,
        status: c.status,
        exclusivoClube: c.exclusivoClube,
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/coupons]", err);
    return serverError();
  }
}
