import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, created, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/companies/[slug]/reviews
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
    if (!company) return notFound("Empresa não encontrada.");

    const reviews = await prisma.review.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
    });

    return ok(reviews);
  } catch (err) {
    console.error("[GET /api/companies/[slug]/reviews]", err);
    return serverError();
  }
}

// POST /api/companies/[slug]/reviews
// Body: { nota: 1-5, comentario }
// Protegido — precisa de token de consumidor logado.
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["consumidor"]);
    if (!auth) return unauthorized("Faça login como consumidor pra avaliar.");

    const { slug } = await params;
    const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
    if (!company) return notFound("Empresa não encontrada.");

    const body = await request.json().catch(() => null);
    const nota = Number(body?.nota);
    const comentario = typeof body?.comentario === "string" ? body.comentario.trim() : "";
    if (!Number.isInteger(nota) || nota < 1 || nota > 5 || !comentario) {
      return badRequest("Informe uma nota de 1 a 5 e um comentário.");
    }

    const user = await prisma.user.findUnique({ where: { id: auth.sub } });

    const review = await prisma.review.create({
      data: {
        companyId: company.id,
        autor: user?.nome ?? "Consumidor BuscaZapp",
        avatarUrl: user?.avatarUrl,
        nota,
        comentario,
      },
    });

    // Recalcula a média/contagem de avaliações da empresa.
    const agg = await prisma.review.aggregate({
      where: { companyId: company.id },
      _avg: { nota: true },
      _count: true,
    });
    await prisma.company.update({
      where: { id: company.id },
      data: {
        avaliacaoMedia: agg._avg.nota ?? nota,
        totalAvaliacoes: agg._count,
      },
    });

    return created(review);
  } catch (err) {
    console.error("[POST /api/companies/[slug]/reviews]", err);
    return serverError();
  }
}
