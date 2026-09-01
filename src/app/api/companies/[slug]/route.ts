import { notFound, ok, serverError } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

// GET /api/companies/[slug]
// Detalhe completo de uma empresa — equivalente ao que a página
// /empresa/[slug] do site mostra hoje com dados mockados.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        categoria: true,
        horarios: true,
        galeria: { orderBy: { ordem: "asc" } },
        products: { where: { ativo: true } },
        services: true,
        promotions: { where: { status: "ativa" } },
        coupons: { where: { status: "ativo" } },
        reviews: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!company) return notFound("Empresa não encontrada.");

    return ok({
      id: company.id,
      slug: company.slug,
      nomeFantasia: company.nomeFantasia,
      razaoSocial: company.razaoSocial,
      cnpj: company.cnpj,
      logoUrl: company.logoUrl,
      capaUrl: company.capaUrl,
      categoriaId: company.categoriaId,
      categoriaNome: company.categoria.nome,
      descricao: company.descricao,
      telefone: company.telefone,
      whatsapp: company.whatsapp,
      email: company.email,
      instagram: company.instagram,
      site: company.site,
      endereco: {
        cep: company.cep,
        logradouro: company.logradouro,
        numero: company.numero,
        complemento: company.complemento,
        bairro: company.bairro,
        cidade: company.cidadeNome,
        estado: company.estado,
        latitude: company.latitude,
        longitude: company.longitude,
      },
      horarios: company.horarios.map((h) => ({
        dia: h.dia,
        aberto: h.aberto,
        inicio: h.inicio,
        fim: h.fim,
      })),
      galeria: company.galeria.map((g) => g.url),
      avaliacaoMedia: company.avaliacaoMedia,
      totalAvaliacoes: company.totalAvaliacoes,
      verificado: company.verificado,
      premium: company.premium,
      planoId: company.planoId,
      reivindicada: company.reivindicada,
      patrocinada: company.patrocinada,
      clubeParceiro: company.clubeParceiro,
      cashbackPercentual: company.cashbackPercentual,
      produtos: company.products,
      servicos: company.services,
      promocoes: company.promotions,
      cupons: company.coupons,
      avaliacoes: company.reviews.map((r) => ({
        id: r.id,
        autor: r.autor,
        avatarUrl: r.avatarUrl,
        nota: r.nota,
        comentario: r.comentario,
        data: r.createdAt,
        resposta: r.respostaTexto
          ? { texto: r.respostaTexto, data: r.respostaData }
          : undefined,
      })),
    });
  } catch (err) {
    console.error("[GET /api/companies/[slug]]", err);
    return serverError();
  }
}
