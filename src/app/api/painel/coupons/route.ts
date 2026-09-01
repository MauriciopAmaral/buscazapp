import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, created, forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/coupons — cupons da empresa logada (qualquer status).
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const coupons = await prisma.coupon.findMany({
      where: { companyId: auth.companyId },
      orderBy: { createdAt: "desc" },
    });

    return ok(coupons);
  } catch (err) {
    console.error("[GET /api/painel/coupons]", err);
    return serverError();
  }
}

// POST /api/painel/coupons — cria um cupom novo pra empresa logada.
// Body: { titulo, descricao, codigo, desconto, validade, limite? }
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const body = await request.json().catch(() => null);
    const titulo = typeof body?.titulo === "string" ? body.titulo.trim() : "";
    const descricao = typeof body?.descricao === "string" ? body.descricao.trim() : "";
    const codigo = typeof body?.codigo === "string" ? body.codigo.trim().toUpperCase() : "";
    const desconto = typeof body?.desconto === "string" ? body.desconto.trim() : "";
    const validade = body?.validade ? new Date(body.validade) : null;
    const limite = Number.isFinite(Number(body?.limite)) ? Number(body.limite) : 0;

    if (!titulo || !descricao || !codigo || !desconto || !validade || isNaN(validade.getTime())) {
      return badRequest("Informe título, descrição, código, desconto e validade.");
    }

    const coupon = await prisma.coupon.create({
      data: {
        companyId: auth.companyId,
        titulo,
        descricao,
        codigo,
        desconto,
        validade,
        limite,
        status: "ativo",
      },
    });

    return created(coupon);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return badRequest("Já existe um cupom com esse código pra essa empresa.");
    }
    console.error("[POST /api/painel/coupons]", err);
    return serverError();
  }
}
