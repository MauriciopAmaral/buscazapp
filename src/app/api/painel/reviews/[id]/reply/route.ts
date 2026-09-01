import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// POST /api/painel/reviews/[id]/reply — responde uma avaliação.
// Body: { texto }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing || existing.companyId !== auth.companyId) return notFound("Avaliação não encontrada.");

    const body = await request.json().catch(() => null);
    const texto = typeof body?.texto === "string" ? body.texto.trim() : "";
    if (!texto) return badRequest("Informe o texto da resposta.");

    const review = await prisma.review.update({
      where: { id },
      data: { respostaTexto: texto, respostaData: new Date() },
    });

    return ok({
      id: review.id,
      companyId: review.companyId,
      autor: review.autor,
      avatarUrl: review.avatarUrl,
      nota: review.nota,
      comentario: review.comentario,
      data: review.createdAt,
      resposta: { texto: review.respostaTexto, data: review.respostaData },
    });
  } catch (err) {
    console.error("[POST /api/painel/reviews/[id]/reply]", err);
    return serverError();
  }
}
