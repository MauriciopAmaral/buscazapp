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
    // Antes só salvava o ícone se ele não ficasse vazio depois do trim —
    // isso impedia limpar/trocar o emoji (digitar, apagar tudo, digitar de
    // novo podia "prender" no valor antigo). Agora qualquer string, mesmo
    // vazia, é aceita — o card de categoria já cai num ícone padrão quando
    // não tem nenhum configurado.
    if (typeof body.icone === "string") data.icone = body.icone.trim();
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

// DELETE /api/admin/categories/[id] — remove uma categoria. Só permite
// quando nenhuma empresa está usando ela (Company.categoriaId é
// obrigatório, sem cascade) — nesse caso, é melhor desativá-la (toggle)
// do que excluir. Categoria em uso: erro 409, com o total de empresas na
// mensagem, pra quem tentar excluir saber por quê.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { companies: true } } },
    });
    if (!existing) return notFound("Categoria não encontrada.");

    if (existing._count.companies > 0) {
      return conflict(
        `Essa categoria está em uso por ${existing._count.companies} empresa(s) — não dá pra excluir. Se quiser tirá-la de circulação, desative-a em vez de excluir.`
      );
    }

    await prisma.category.delete({ where: { id } });
    return ok({ excluida: true });
  } catch (err) {
    console.error("[DELETE /api/admin/categories/[id]]", err);
    return serverError();
  }
}
