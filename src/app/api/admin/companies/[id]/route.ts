import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { mapCompany } from "@/lib/companyData";
import { resolveCategoriaId } from "@/lib/resolveCategoria";

const detailInclude = { categoria: true, horarios: true, galeria: { orderBy: { ordem: "asc" as const } } };

// GET /api/admin/companies/[id] — detalhe completo de uma empresa (qualquer status), pro admin editar.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem ver isso.");

    const { id } = await params;
    const company = await prisma.company.findUnique({ where: { id }, include: detailInclude });
    if (!company) return notFound("Empresa não encontrada.");

    return ok(mapCompany(company, company.galeria.map((g) => g.url)));
  } catch (err) {
    console.error("[GET /api/admin/companies/[id]]", err);
    return serverError();
  }
}

const STATUS_VALIDOS = ["ativo", "pendente", "suspenso"] as const;
const PLANOS_VALIDOS = ["gratuito", "pro", "premium", "premium_plus"] as const;

// PATCH /api/admin/companies/[id] — edição completa por um administrador:
// dados gerais, contato, endereço, segmento e os campos administrativos
// (status, verificado, premium, planoId, reivindicada).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem editar empresas.");

    const { id } = await params;
    const existente = await prisma.company.findUnique({ where: { id } });
    if (!existente) return notFound("Empresa não encontrada.");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    const camposTexto = [
      "nomeFantasia",
      "razaoSocial",
      "descricao",
      "telefone",
      "whatsapp",
      "email",
      "instagram",
      "site",
      "cep",
      "logradouro",
      "numero",
      "complemento",
      "bairro",
      "cidadeNome",
      "estado",
      "logoUrl",
      "capaUrl",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const campo of camposTexto) {
      if (typeof body[campo] === "string") data[campo] = body[campo];
    }

    if (typeof body.status === "string") {
      if (!STATUS_VALIDOS.includes(body.status as (typeof STATUS_VALIDOS)[number])) {
        return badRequest("Status inválido.");
      }
      data.status = body.status;
    }
    if (typeof body.verificado === "boolean") data.verificado = body.verificado;
    if (typeof body.premium === "boolean") data.premium = body.premium;
    if (typeof body.reivindicada === "boolean") data.reivindicada = body.reivindicada;
    if (typeof body.planoId === "string") {
      if (!PLANOS_VALIDOS.includes(body.planoId as (typeof PLANOS_VALIDOS)[number])) {
        return badRequest("Plano inválido.");
      }
      data.planoId = body.planoId;
    }

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
      where: { id },
      data,
      include: detailInclude,
    });

    return ok(mapCompany(company, company.galeria.map((g) => g.url)));
  } catch (err) {
    console.error("[PATCH /api/admin/companies/[id]]", err);
    return serverError();
  }
}

// DELETE /api/admin/companies/[id] — remove a empresa e tudo que depende
// dela (produtos, serviços, cupons, avaliações etc. têm onDelete: Cascade
// no schema). Contas de usuário vinculadas (User.companyId) não têm
// cascade — são desvinculadas primeiro, numa transação, pra não sobrar
// referência quebrada nem falhar por causa da constraint.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem excluir empresas.");

    const { id } = await params;
    const existente = await prisma.company.findUnique({ where: { id } });
    if (!existente) return notFound("Empresa não encontrada.");

    await prisma.$transaction([
      prisma.user.updateMany({ where: { companyId: id }, data: { companyId: null } }),
      prisma.company.delete({ where: { id } }),
    ]);

    return ok({ excluida: true });
  } catch (err) {
    console.error("[DELETE /api/admin/companies/[id]]", err);
    return serverError();
  }
}
