import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, conflict, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { slugify } from "@/lib/utils";

// PATCH /api/admin/categories/[id] — edita nome/ícone/descrição e/ou
// ativa/desativa uma categoria. Body aceita qualquer subconjunto de:
// { nome, icone, descricao, ativo }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return notFound("Categoria não encontrada.");

    const data: { nome?: string; slug?: string; icone?: string; descricao?: string; ativo?: boolean } = {};

    if (typeof body.nome === "string" && body.nome.trim()) {
      const nome = body.nome.trim();
      data.nome = nome;
      const novoSlug = slugify(nome);
      if (novoSlug !== existing.slug) {
        const conflitante = await prisma.category.findUnique({ where: { slug: novoSlug } });
        if (conflitante && conflitante.id !== id) return conflict("Já existe uma categoria com esse nome.");
        data.slug = novoSlug;
      }
    }
    if (typeof body.icone === "string" && body.icone.trim()) data.icone = body.icone.trim();
    if (typeof body.descricao === "string") data.descricao = body.descricao.trim();
    if (typeof body.ativo === "boolean") data.ativo = body.ativo;

    if (Object.keys(data).length === 0) {
      return badRequest("Nenhum campo válido pra atualizar.");
    }

    const categoria = await prisma.category.update({
      where: { id },
      data,
      include: { _count: { select: { companies: true } } },
    });

    return ok({
      id: categoria.id,
      slug: categoria.slug,
      nome: categoria.nome,
      icone: categoria.icone,
      descricao: categoria.descricao,
      ativo: categoria.ativo,
      totalEmpresas: categoria._count.companies,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/categories/[id]]", err);
    return serverError();
  }
}
