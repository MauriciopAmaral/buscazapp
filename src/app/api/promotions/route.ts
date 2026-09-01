import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/apiResponse";

// GET /api/promotions?companyId=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") ?? undefined;

    const promotions = await prisma.promotion.findMany({
      where: {
        status: "ativa",
        ...(companyId ? { companyId } : {}),
      },
      include: { company: { select: { nomeFantasia: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok(
      promotions.map((p) => ({
        id: p.id,
        companyId: p.companyId,
        companyNome: p.company.nomeFantasia,
        companySlug: p.company.slug,
        titulo: p.titulo,
        descricao: p.descricao,
        imagemUrl: p.imagemUrl,
        inicio: p.inicio,
        termino: p.termino,
        preco: p.preco,
        precoPromocional: p.precoPromocional,
        status: p.status,
      }))
    );
  } catch (err) {
    console.error("[GET /api/promotions]", err);
    return serverError();
  }
}
