import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/apiResponse";

// GET /api/coupons?companyId=&clube=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") ?? undefined;
    const soClube = searchParams.get("clube") === "1";

    const coupons = await prisma.coupon.findMany({
      where: {
        status: "ativo",
        ...(companyId ? { companyId } : {}),
        ...(soClube ? { exclusivoClube: true } : {}),
      },
      include: { company: { select: { nomeFantasia: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(
      coupons.map((c) => ({
        id: c.id,
        companyId: c.companyId,
        companyNome: c.company.nomeFantasia,
        companySlug: c.company.slug,
        titulo: c.titulo,
        descricao: c.descricao,
        codigo: c.codigo,
        desconto: c.desconto,
        validade: c.validade,
        limite: c.limite,
        utilizados: c.utilizados,
        status: c.status,
        exclusivoClube: c.exclusivoClube,
      }))
    );
  } catch (err) {
    console.error("[GET /api/coupons]", err);
    return serverError();
  }
}
