import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/apiResponse";

// GET /api/club/partners — empresas parceiras do BuscaZapp Clube.
export async function GET() {
  try {
    const partners = await prisma.company.findMany({
      where: { clubeParceiro: true, status: "ativo" },
      include: { categoria: true },
      orderBy: { avaliacaoMedia: "desc" },
    });

    return ok(
      partners.map((c) => ({
        id: c.id,
        slug: c.slug,
        nomeFantasia: c.nomeFantasia,
        logoUrl: c.logoUrl,
        capaUrl: c.capaUrl,
        categoriaNome: c.categoria.nome,
        avaliacaoMedia: c.avaliacaoMedia,
        totalAvaliacoes: c.totalAvaliacoes,
        cidadeNome: c.cidadeNome,
        bairro: c.bairro,
      }))
    );
  } catch (err) {
    console.error("[GET /api/club/partners]", err);
    return serverError();
  }
}
