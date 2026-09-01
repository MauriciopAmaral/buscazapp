import { prisma } from "@/lib/prisma";
import { notFound, ok, serverError } from "@/lib/apiResponse";

// GET /api/categories/[slug]
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return notFound("Categoria não encontrada.");

    const companies = await prisma.company.findMany({
      where: { categoriaId: category.id, status: "ativo" },
      orderBy: [{ patrocinada: "desc" }, { avaliacaoMedia: "desc" }],
    });

    return ok({
      id: category.id,
      slug: category.slug,
      nome: category.nome,
      icone: category.icone,
      descricao: category.descricao,
      totalEmpresas: companies.length,
      empresas: companies.map((c) => ({
        id: c.id,
        slug: c.slug,
        nomeFantasia: c.nomeFantasia,
        logoUrl: c.logoUrl,
        capaUrl: c.capaUrl,
        avaliacaoMedia: c.avaliacaoMedia,
        totalAvaliacoes: c.totalAvaliacoes,
        verificado: c.verificado,
        premium: c.premium,
        cidadeNome: c.cidadeNome,
        bairro: c.bairro,
      })),
    });
  } catch (err) {
    console.error("[GET /api/categories/[slug]]", err);
    return serverError();
  }
}
