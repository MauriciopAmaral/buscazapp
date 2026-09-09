import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { calcularValorBoost, isBoostDuracao, isBoostTipo } from "@/lib/boostCatalog";
import { mpConfigured } from "@/lib/mercadopago";

// GET /api/painel/boosts — histórico de impulsionamentos comprados pela
// empresa logada (pendentes, pagos, cancelados), mais recentes primeiro.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const boosts = await prisma.boost.findMany({
      where: { companyId: auth.companyId },
      orderBy: { createdAt: "desc" },
      include: { ad: true },
    });

    return ok(boosts);
  } catch (err) {
    console.error("[GET /api/painel/boosts]", err);
    return serverError();
  }
}

// POST /api/painel/boosts — a empresa escolhe um formato de impulsionamento
// e uma duração; só cria o registro (status "pendente") com o preço
// calculado no servidor. O pagamento em si acontece depois, sem sair da
// página, em POST /api/painel/boosts/[id]/pagar (Payment Brick do
// Mercado Pago — Pix ou cartão de crédito).
// Body: { tipo, dias }
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    if (!mpConfigured()) {
      return serverError(
        "Pagamento ainda não foi configurado neste projeto (falta a variável de ambiente MP_ACCESS_TOKEN)."
      );
    }

    const body = await request.json().catch(() => null);
    const tipo = typeof body?.tipo === "string" ? body.tipo : "";
    const dias = Number(body?.dias);

    if (!isBoostTipo(tipo)) return badRequest("Formato de impulsionamento inválido.");
    if (!Number.isFinite(dias) || !isBoostDuracao(dias)) return badRequest("Duração inválida.");

    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: { id: true },
    });
    if (!company) return forbidden("Empresa não encontrada.");

    const valor = calcularValorBoost(tipo, dias);

    const boost = await prisma.boost.create({
      data: { companyId: auth.companyId, tipo, dias, valor, status: "pendente" },
    });

    return ok({ boostId: boost.id, valor });
  } catch (err) {
    console.error("[POST /api/painel/boosts]", err);
    return serverError("Não foi possível criar o impulsionamento. Tente novamente em instantes.");
  }
}
