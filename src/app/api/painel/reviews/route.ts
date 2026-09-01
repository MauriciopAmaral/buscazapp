import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/reviews — avaliações recebidas pela empresa logada.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const reviews = await prisma.review.findMany({
      where: { companyId: auth.companyId },
      orderBy: { createdAt: "desc" },
    });
    // Mesmo formato do tipo `Review` do frontend (resposta aninhada, não campos soltos).
    return ok(
      reviews.map((r) => ({
        id: r.id,
        companyId: r.companyId,
        autor: r.autor,
        avatarUrl: r.avatarUrl,
        nota: r.nota,
        comentario: r.comentario,
        data: r.createdAt,
        resposta: r.respostaTexto ? { texto: r.respostaTexto, data: r.respostaData } : undefined,
      }))
    );
  } catch (err) {
    console.error("[GET /api/painel/reviews]", err);
    return serverError();
  }
}
