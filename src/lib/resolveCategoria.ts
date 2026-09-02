import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// Garante um slug único pra Category, tentando "nome", depois "nome-2", etc.
async function uniqueCategorySlug(base: string): Promise<string> {
  const raw = slugify(base) || "categoria";
  let candidate = raw;
  let i = 2;
  for (;;) {
    const existing = await prisma.category.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = `${raw}-${i}`;
    i += 1;
  }
}

/**
 * Resolve o `categoriaId` a usar numa Company a partir do body de uma
 * requisição — ou um id de categoria já existente, ou o nome de uma
 * categoria nova (cria na hora, ou reaproveita se já existir uma com o
 * mesmo slug). Usado tanto no cadastro de empresa nova quanto na edição
 * (PATCH) de "Minha empresa", pra empresas conseguirem adicionar o próprio
 * segmento quando ele não está na lista.
 */
export async function resolveCategoriaId(
  categoriaId: string,
  novaCategoriaNome: string
): Promise<{ id: string } | { error: string }> {
  if (categoriaId) {
    const categoria = await prisma.category.findUnique({ where: { id: categoriaId } });
    if (!categoria) return { error: "Categoria não encontrada." };
    return { id: categoria.id };
  }
  if (novaCategoriaNome) {
    const categoriaSlug = slugify(novaCategoriaNome);
    const existente = categoriaSlug ? await prisma.category.findUnique({ where: { slug: categoriaSlug } }) : null;
    if (existente) return { id: existente.id };
    const novaSlug = await uniqueCategorySlug(novaCategoriaNome);
    const novaCategoria = await prisma.category.create({
      data: { slug: novaSlug, nome: novaCategoriaNome, icone: "🏷️", ativo: true },
    });
    return { id: novaCategoria.id };
  }
  return { error: "Selecione um segmento ou informe o nome do novo segmento." };
}
