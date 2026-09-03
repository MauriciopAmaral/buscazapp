import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { getOrCreateSettings } from "@/lib/settings";
import { isPaletaValida } from "@/lib/palettes";

// GET /api/admin/settings — configurações completas (inclui os toggles de
// notificação interna), pra tela Admin → Configurações.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem ver essa página.");

    const settings = await getOrCreateSettings();
    return ok(settings);
  } catch (err) {
    console.error("[GET /api/admin/settings]", err);
    return serverError();
  }
}

// PATCH /api/admin/settings — salva as configurações gerais. Body aceita
// qualquer subconjunto dos campos abaixo.
export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem alterar essa página.");

    await getOrCreateSettings();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    const data: {
      nomePlataforma?: string;
      emailSuporte?: string;
      logoUrl?: string | null;
      paletaCor?: string;
      notificarReivindicacoes?: boolean;
      notificarPagamentosPendentes?: boolean;
      modoManutencao?: boolean;
      mostrarCategoriasPopulares?: boolean;
      mostrarEmpresasPertoDeVoce?: boolean;
      mostrarOfertas?: boolean;
      mostrarCupons?: boolean;
      mostrarEmpresasDestaque?: boolean;
      rodapeTexto?: string;
    } = {};

    if (typeof body.nomePlataforma === "string") {
      const nome = body.nomePlataforma.trim();
      if (!nome) return badRequest("O nome da plataforma não pode ficar vazio.");
      data.nomePlataforma = nome;
    }
    if (typeof body.emailSuporte === "string") {
      const email = body.emailSuporte.trim();
      if (!email.includes("@")) return badRequest("Informe um e-mail de suporte válido.");
      data.emailSuporte = email;
    }
    if (typeof body.logoUrl === "string" || body.logoUrl === null) {
      data.logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() || null : null;
    }
    if (typeof body.paletaCor === "string") {
      if (!isPaletaValida(body.paletaCor)) return badRequest("Paleta de cor inválida.");
      data.paletaCor = body.paletaCor;
    }
    if (typeof body.notificarReivindicacoes === "boolean") data.notificarReivindicacoes = body.notificarReivindicacoes;
    if (typeof body.notificarPagamentosPendentes === "boolean") data.notificarPagamentosPendentes = body.notificarPagamentosPendentes;
    if (typeof body.modoManutencao === "boolean") data.modoManutencao = body.modoManutencao;
    if (typeof body.mostrarCategoriasPopulares === "boolean") data.mostrarCategoriasPopulares = body.mostrarCategoriasPopulares;
    if (typeof body.mostrarEmpresasPertoDeVoce === "boolean") data.mostrarEmpresasPertoDeVoce = body.mostrarEmpresasPertoDeVoce;
    if (typeof body.mostrarOfertas === "boolean") data.mostrarOfertas = body.mostrarOfertas;
    if (typeof body.mostrarCupons === "boolean") data.mostrarCupons = body.mostrarCupons;
    if (typeof body.mostrarEmpresasDestaque === "boolean") data.mostrarEmpresasDestaque = body.mostrarEmpresasDestaque;
    if (typeof body.rodapeTexto === "string") data.rodapeTexto = body.rodapeTexto.trim();

    const settings = await prisma.platformSettings.update({ where: { id: "singleton" }, data });
    return ok(settings);
  } catch (err) {
    console.error("[PATCH /api/admin/settings]", err);
    return serverError();
  }
}
