import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, conflict, created, serverError, unauthorized } from "@/lib/apiResponse";
import { slugify } from "@/lib/utils";

// POST /api/admin/categories — cria uma categoria nova.
// Body: { nome, icone?, descricao? }
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const body = await request.json().catch(() => null);
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const icone = typeof body?.icone === "string" && body.icone.trim() ? body.icone.trim() : "🏷️";
    const descricao = typeof body?.descricao === "string" ? body.descricao.trim() : undefined;

    if (!nome) return badRequest("Informe o nome da categoria.");

    const slug = slugify(nome);
    if (!slug) return badRequest("Nome inválido — não deu pra gerar um slug.");

    const existente = await prisma.category.findUnique({ where: { slug } });
    if (existente) return conflict("Já existe uma categoria com esse nome.");

    const categoria = await prisma.category.create({
      data: { slug, nome, icone, descricao, ativo: true },
      include: { _count: { select: { companies: true } } },
    });

    return created({
      id: categoria.id,
      slug: categoria.slug,
      nome: categoria.nome,
      icone: categoria.icone,
      descricao: categoria.descricao,
      ativo: categoria.ativo,
      totalEmpresas: categoria._count.companies,
    });
  } catch (err) {
    console.error("[POST /api/admin/categories]", err);
    return serverError();
  }
}
