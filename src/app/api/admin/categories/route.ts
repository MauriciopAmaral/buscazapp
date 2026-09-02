import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, conflict, created, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { slugify } from "@/lib/utils";

// GET /api/admin/categories — todas as categorias (ativas e inativas), pro
// admin gerenciar. A rota pública /api/categories só devolve as ativas
// (é o que alimenta os filtros do site), então o admin precisa dessa
// própria pra conseguir ver e reativar uma categoria desativada.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const categories = await prisma.category.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { companies: true } } },
    });

    return ok(
      categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        nome: c.nome,
        icone: c.icone,
        descricao: c.descricao,
        ativo: c.ativo,
        totalEmpresas: c._count.companies,
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/categories]", err);
    return serverError();
  }
}

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
