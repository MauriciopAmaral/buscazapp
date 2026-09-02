import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { mapCompany } from "@/lib/companyData";
import { resolveCategoriaId } from "@/lib/resolveCategoria";

// GET /api/painel/company — dados completos da empresa do usuário logado.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      include: { horarios: true, galeria: { orderBy: { ordem: "asc" } }, categoria: true },
    });
    if (!company) return notFound("Empresa não encontrada.");

    // Mesmo formato (tipo `Company` do frontend) usado no resto do site.
    return ok(mapCompany(company, company.galeria.map((g) => g.url)));
  } catch (err) {
    console.error("[GET /api/painel/company]", err);
    return serverError();
  }
}

// PATCH /api/painel/company — atualiza campos básicos do perfil.
// Body aceita qualquer subconjunto de: nomeFantasia, descricao, telefone,
// whatsapp, email, instagram, site.
export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    const allowedFields = [
      "nomeFantasia",
      "descricao",
      "telefone",
      "whatsapp",
      "email",
      "instagram",
      "site",
      "logoUrl",
      "capaUrl",
    ] as const;

    const data: Record<string, string> = {};
    for (const field of allowedFields) {
      if (typeof body[field] === "string") data[field] = body[field];
    }

    // categoriaId (trocar de segmento) ou novaCategoriaNome (cadastrar um
    // segmento que ainda não existe na lista) — mesma lógica do cadastro.
    const categoriaId = typeof body.categoriaId === "string" ? body.categoriaId.trim() : "";
    const novaCategoriaNome = typeof body.novaCategoriaNome === "string" ? body.novaCategoriaNome.trim() : "";
    if (categoriaId || novaCategoriaNome) {
      const categoriaResolvida = await resolveCategoriaId(categoriaId, novaCategoriaNome);
      if ("error" in categoriaResolvida) return badRequest(categoriaResolvida.error);
      data.categoriaId = categoriaResolvida.id;
    }

    if (Object.keys(data).length === 0) {
      return badRequest("Nenhum campo válido pra atualizar.");
    }

    const company = await prisma.company.update({
      where: { id: auth.companyId },
      data,
      include: { horarios: true, galeria: { orderBy: { ordem: "asc" } }, categoria: true },
    });

    return ok(mapCompany(company, company.galeria.map((g) => g.url)));
  } catch (err) {
    console.error("[PATCH /api/painel/company]", err);
    return serverError();
  }
}
