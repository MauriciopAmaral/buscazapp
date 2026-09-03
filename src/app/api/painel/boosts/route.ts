import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { BOOST_CATALOGO, calcularValorBoost, isBoostDuracao, isBoostTipo } from "@/lib/boostCatalog";
import { mpConfigured, mpPreferenceClient, siteBaseUrl } from "@/lib/mercadopago";

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
// e uma duração; cria o registro (status "pendente") e devolve o link de
// pagamento do Mercado Pago (init_point) pra redirecionar o navegador.
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
      select: { nomeFantasia: true, email: true },
    });
    if (!company) return forbidden("Empresa não encontrada.");

    const valor = calcularValorBoost(tipo, dias);
    const catalogo = BOOST_CATALOGO[tipo];

    const boost = await prisma.boost.create({
      data: { companyId: auth.companyId, tipo, dias, valor, status: "pendente" },
    });

    const base = siteBaseUrl();
    try {
      const preference = await mpPreferenceClient().create({
        body: {
          items: [
            {
              id: boost.id,
              title: `Impulsionamento — ${catalogo.nome} (${dias} dias)`,
              description: `${company.nomeFantasia} — ${catalogo.descricao}`,
              quantity: 1,
              unit_price: valor,
              currency_id: "BRL",
            },
          ],
          external_reference: boost.id,
          notification_url: `${base}/api/webhooks/mercadopago`,
          back_urls: {
            success: `${base}/painel/impulsionar/retorno?boost=${boost.id}`,
            pending: `${base}/painel/impulsionar/retorno?boost=${boost.id}`,
            failure: `${base}/painel/impulsionar/retorno?boost=${boost.id}`,
          },
          auto_return: "approved",
          statement_descriptor: "BUSCAZAPP",
          payer: company.email ? { email: company.email } : undefined,
        },
      });

      await prisma.boost.update({
        where: { id: boost.id },
        data: { mpPreferenceId: preference.id ?? null },
      });

      return ok({ boostId: boost.id, initPoint: preference.init_point });
    } catch (mpErr) {
      // A preferência falhou (ex: token inválido) — não deixa o Boost órfão em "pendente" pra sempre.
      await prisma.boost.update({ where: { id: boost.id }, data: { status: "cancelado" } });
      throw mpErr;
    }
  } catch (err) {
    console.error("[POST /api/painel/boosts]", err);
    return serverError("Não foi possível iniciar o pagamento. Tente novamente em instantes.");
  }
}
