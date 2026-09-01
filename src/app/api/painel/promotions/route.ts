import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, created, forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/promotions — promoções da empresa logada (qualquer status).
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const promotions = await prisma.promotion.findMany({
      where: { companyId: auth.companyId },
      orderBy: { createdAt: "desc" },
    });
    return ok(promotions);
  } catch (err) {
    console.error("[GET /api/painel/promotions]", err);
    return serverError();
  }
}

// POST /api/painel/promotions — cria uma promoção nova.
// Body: { titulo, descricao, imagemUrl?, inicio, termino, preco, precoPromocional }
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const body = await request.json().catch(() => null);
    const titulo = typeof body?.titulo === "string" ? body.titulo.trim() : "";
    const descricao = typeof body?.descricao === "string" ? body.descricao.trim() : "";
    const imagemUrl = typeof body?.imagemUrl === "string" ? body.imagemUrl : null;
    const inicio = body?.inicio ? new Date(body.inicio) : null;
    const termino = body?.termino ? new Date(body.termino) : null;
    const preco = Number(body?.preco);
    const precoPromocional = Number(body?.precoPromocional);

    if (
      !titulo ||
      !descricao ||
      !inicio ||
      isNaN(inicio.getTime()) ||
      !termino ||
      isNaN(termino.getTime()) ||
      !Number.isFinite(preco) ||
      !Number.isFinite(precoPromocional)
    ) {
      return badRequest("Informe título, descrição, datas e preços válidos.");
    }

    const promotion = await prisma.promotion.create({
      data: {
        companyId: auth.companyId,
        titulo,
        descricao,
        imagemUrl,
        inicio,
        termino,
        preco,
        precoPromocional,
        status: "ativa",
      },
    });

    return created(promotion);
  } catch (err) {
    console.error("[POST /api/painel/promotions]", err);
    return serverError();
  }
}
