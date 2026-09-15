// Camada de leitura pro lado do servidor (Server Components) — busca direto
// no Prisma/MySQL, sem passar pela API REST (que existe pra clientes fora do
// Next.js: o próprio site do lado do navegador e, mais pra frente, os apps
// Android/iOS). Os mappers aqui devolvem exatamente os tipos que já existiam
// em `src/types`, então os componentes visuais (CompanyCard, CompanyTabs
// etc.) não precisaram mudar.

import { prisma } from "@/lib/prisma";
import type { Company, Coupon, HorarioDia, Product, Promotion, Review, Service } from "@/types";
import { getActiveAdCompanyIds, getActiveAdCompanyIdsByTipo } from "@/lib/adBoosts";

/** Reordena mantendo a ordem original dentro de cada grupo (sort é estável): impulsionados primeiro. */
function comImpulsionadosNaFrente(empresas: Company[], impulsionados: Set<string>): Company[] {
  if (impulsionados.size === 0) return empresas;
  return [...empresas].sort((a, b) => Number(impulsionados.has(b.id)) - Number(impulsionados.has(a.id)));
}

/** IDs de empresas com promoção/cupom ativos agora — pra ligar os badges "Promoção"/"Cupom" do CompanyCard com dado real. */
export async function getPromoECupomCompanyIds(): Promise<{ promoIds: Set<string>; cupomIds: Set<string> }> {
  const [promos, cupons] = await Promise.all([
    prisma.promotion.findMany({ where: { status: "ativa" }, select: { companyId: true }, distinct: ["companyId"] }),
    prisma.coupon.findMany({ where: { status: "ativo" }, select: { companyId: true }, distinct: ["companyId"] }),
  ]);
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, que este sandbox não consegue rodar (ver AGENTS.md / HOSTINGER_MYSQL_SETUP.md); na Vercel o build gera o client normalmente.
    promoIds: new Set((promos as any[]).map((p) => p.companyId as string)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cupomIds: new Set((cupons as any[]).map((c) => c.companyId as string)),
  };
}

function comFlagsDePromoECupom(empresas: Company[], promoIds: Set<string>, cupomIds: Set<string>): Company[] {
  if (promoIds.size === 0 && cupomIds.size === 0) return empresas;
  return empresas.map((c) => ({
    ...c,
    temPromocaoAtiva: promoIds.has(c.id),
    temCupomAtivo: cupomIds.has(c.id),
  }));
}

// -------------------- Empresa --------------------

export const companyListInclude = { categoria: true, horarios: true } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, que este sandbox não consegue rodar (ver AGENTS.md / HOSTINGER_MYSQL_SETUP.md); na Vercel o build gera o client normalmente.
function mapHorarios(horarios: any[]): HorarioDia[] {
  return horarios.map((h) => ({
    dia: h.dia,
    aberto: h.aberto,
    inicio: h.inicio ?? undefined,
    fim: h.fim ?? undefined,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCompany(c: any, galeria: string[] = []): Company {
  return {
    id: c.id,
    slug: c.slug,
    nomeFantasia: c.nomeFantasia,
    razaoSocial: c.razaoSocial,
    cnpj: c.cnpj,
    logoUrl: c.logoUrl ?? "",
    capaUrl: c.capaUrl ?? "",
    categoriaId: c.categoriaId,
    categoriaNome: c.categoria.nome,
    descricao: c.descricao,
    telefone: c.telefone,
    whatsapp: c.whatsapp,
    email: c.email ?? undefined,
    instagram: c.instagram ?? undefined,
    site: c.site ?? undefined,
    endereco: {
      cep: c.cep,
      logradouro: c.logradouro,
      numero: c.numero,
      complemento: c.complemento ?? undefined,
      bairro: c.bairro,
      cidade: c.cidadeNome,
      estado: c.estado,
      latitude: c.latitude,
      longitude: c.longitude,
    },
    horarios: mapHorarios(c.horarios ?? []),
    galeria,
    avaliacaoMedia: c.avaliacaoMedia,
    totalAvaliacoes: c.totalAvaliacoes,
    verificado: c.verificado,
    premium: c.premium,
    planoId: c.planoId,
    reivindicada: c.reivindicada,
    patrocinada: c.patrocinada,
    status: c.status,
    criadoEm: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    clubeParceiro: c.clubeParceiro,
    cashbackPercentual: c.cashbackPercentual,
  };
}

/** Empresas ativas, mais recentes primeiro (patrocinadas e impulsionadas sempre no topo). */
export async function getCompanies(take?: number): Promise<Company[]> {
  // Usada na home como "Empresas perto de você" — conta tanto o impulsionamento
  // "Resultado patrocinado" (geral) quanto "Destaque na cidade".
  const [impulsionadas, { promoIds, cupomIds }] = await Promise.all([
    getActiveAdCompanyIdsByTipo(["resultado_patrocinado", "destaque_cidade"]),
    getPromoECupomCompanyIds(),
  ]);
  const boostIds = new Set([...impulsionadas.resultado_patrocinado, ...impulsionadas.destaque_cidade]);

  const rows = await prisma.company.findMany({
    where: { status: "ativo" },
    orderBy: [{ patrocinada: "desc" }, { verificado: "desc" }, { createdAt: "desc" }],
    include: companyListInclude,
    // Se tem algum impulsionamento ativo, busca todo mundo (sem cortar em
    // `take`) — senão uma empresa impulsionada que estivesse mal rankeada
    // na ordem normal (pouco avaliada, cadastro antigo) nunca apareceria,
    // já que o corte aconteceria ANTES dela ser colocada na frente.
    ...(take && boostIds.size === 0 ? { take } : {}),
  });
  const empresas: Company[] = comFlagsDePromoECupom(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, que este sandbox não consegue rodar (ver AGENTS.md / HOSTINGER_MYSQL_SETUP.md); na Vercel o build gera o client normalmente.
    (rows as any[]).map((c) => ({
      ...mapCompany(c),
      patrocinada: c.patrocinada || impulsionadas.resultado_patrocinado.has(c.id),
    })),
    promoIds,
    cupomIds
  );
  const ordenadas = comImpulsionadosNaFrente(empresas, boostIds);
  return take ? ordenadas.slice(0, take) : ordenadas;
}

export async function getCompaniesByCategorySlug(categoriaSlug: string): Promise<Company[]> {
  const [impulsionadas, { promoIds, cupomIds }] = await Promise.all([
    getActiveAdCompanyIds("destaque_categoria"),
    getPromoECupomCompanyIds(),
  ]);
  const rows = await prisma.company.findMany({
    where: { status: "ativo", categoria: { slug: categoriaSlug } },
    orderBy: [{ patrocinada: "desc" }, { verificado: "desc" }],
    include: companyListInclude,
  });
  const empresas = comFlagsDePromoECupom(rows.map((c) => mapCompany(c)), promoIds, cupomIds);
  return comImpulsionadosNaFrente(empresas, impulsionadas);
}

export async function getFeaturedCompanies(take = 6): Promise<Company[]> {
  const [impulsionadas, { promoIds, cupomIds }] = await Promise.all([
    getActiveAdCompanyIds("destaque_home"),
    getPromoECupomCompanyIds(),
  ]);
  const rows = await prisma.company.findMany({
    where: { status: "ativo", OR: [{ premium: true }, { id: { in: Array.from(impulsionadas) } }] },
    orderBy: [{ patrocinada: "desc" }, { avaliacaoMedia: "desc" }],
    include: companyListInclude,
    ...(impulsionadas.size ? {} : { take }),
  });
  const empresas = comFlagsDePromoECupom(rows.map((c) => mapCompany(c)), promoIds, cupomIds);
  return comImpulsionadosNaFrente(empresas, impulsionadas).slice(0, take);
}

export async function getClubPartnerCompanies(): Promise<Company[]> {
  const [rows, { promoIds, cupomIds }] = await Promise.all([
    prisma.company.findMany({
      where: { status: "ativo", clubeParceiro: true },
      orderBy: [{ patrocinada: "desc" }, { avaliacaoMedia: "desc" }],
      include: companyListInclude,
    }),
    getPromoECupomCompanyIds(),
  ]);
  return comFlagsDePromoECupom(rows.map((c) => mapCompany(c)), promoIds, cupomIds);
}

export async function getCompaniesByIds(ids: string[]): Promise<Company[]> {
  if (ids.length === 0) return [];
  const [rows, { promoIds, cupomIds }] = await Promise.all([
    prisma.company.findMany({
      where: { id: { in: ids } },
      include: companyListInclude,
    }),
    getPromoECupomCompanyIds(),
  ]);
  return comFlagsDePromoECupom(rows.map((c) => mapCompany(c)), promoIds, cupomIds);
}

export interface CompanyDetail extends Company {
  produtos: Product[];
  servicos: Service[];
  promocoes: Promotion[];
  cupons: Coupon[];
  avaliacoes: Review[];
}

export async function getCompanyDetailBySlug(slug: string): Promise<CompanyDetail | null> {
  const c = await prisma.company.findUnique({
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
  if (!c) return null;

  const base = mapCompany(
    c,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.galeria.map((g: any) => g.url)
  );

  return {
    ...base,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    produtos: c.products.map((p: any) => ({
      id: p.id,
      companyId: p.companyId,
      imagemUrl: p.imagemUrl ?? "",
      nome: p.nome,
      descricao: p.descricao,
      preco: Number(p.preco),
      precoPromocional: p.precoPromocional != null ? Number(p.precoPromocional) : undefined,
      ativo: p.ativo,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    servicos: c.services.map((s: any) => ({
      id: s.id,
      companyId: s.companyId,
      nome: s.nome,
      descricao: s.descricao,
      precoInicial: Number(s.precoInicial),
      imagemUrl: s.imagemUrl ?? "",
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    promocoes: c.promotions.map((p: any) => ({
      id: p.id,
      companyId: p.companyId,
      companyNome: c.nomeFantasia,
      companySlug: c.slug,
      titulo: p.titulo,
      descricao: p.descricao,
      imagemUrl: p.imagemUrl ?? "",
      inicio: p.inicio instanceof Date ? p.inicio.toISOString() : String(p.inicio),
      termino: p.termino instanceof Date ? p.termino.toISOString() : String(p.termino),
      preco: Number(p.preco),
      precoPromocional: Number(p.precoPromocional),
      status: p.status,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cupons: c.coupons.map((cp: any) => ({
      id: cp.id,
      companyId: cp.companyId,
      companyNome: c.nomeFantasia,
      companySlug: c.slug,
      titulo: cp.titulo,
      descricao: cp.descricao,
      codigo: cp.codigo,
      desconto: cp.desconto,
      validade: cp.validade instanceof Date ? cp.validade.toISOString() : String(cp.validade),
      limite: cp.limite,
      utilizados: cp.utilizados,
      status: cp.status,
      exclusivoClube: cp.exclusivoClube,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    avaliacoes: c.reviews.map((r: any) => ({
      id: r.id,
      companyId: r.companyId,
      autor: r.autor,
      avatarUrl: r.avatarUrl ?? undefined,
      nota: r.nota,
      comentario: r.comentario,
      data: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      resposta:
        r.respostaTexto && r.respostaData
          ? {
              texto: r.respostaTexto,
              data: r.respostaData instanceof Date ? r.respostaData.toISOString() : String(r.respostaData),
            }
          : undefined,
    })),
  };
}

export async function getAllCompanySlugs(): Promise<string[]> {
  const rows = await prisma.company.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

// -------------------- Promoções e cupons (listagens gerais) --------------------

export async function getActivePromotions(take?: number): Promise<Promotion[]> {
  // Impulsionamento "Promoção destacada" — a promoção da empresa aparece
  // na frente da aba Ofertas enquanto o impulsionamento estiver ativo.
  const impulsionadas = await getActiveAdCompanyIds("promocao_destacada");
  const rows = await prisma.promotion.findMany({
    where: { status: "ativa" },
    orderBy: { createdAt: "desc" },
    include: { company: { select: { nomeFantasia: true, slug: true } } },
    // Mesma lógica de getCompanies(): com impulsionamento ativo, busca
    // tudo (sem `take`) — senão uma promoção impulsionada mal rankeada
    // na ordem normal (mais antiga) nunca seria alcançada, já que o
    // corte aconteceria antes dela ser colocada na frente.
    ...(take && impulsionadas.size === 0 ? { take } : {}),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promocoes = rows.map((p: any) => ({
    id: p.id,
    companyId: p.companyId,
    companyNome: p.company.nomeFantasia,
    companySlug: p.company.slug,
    titulo: p.titulo,
    descricao: p.descricao,
    imagemUrl: p.imagemUrl ?? "",
    inicio: p.inicio instanceof Date ? p.inicio.toISOString() : String(p.inicio),
    termino: p.termino instanceof Date ? p.termino.toISOString() : String(p.termino),
    preco: Number(p.preco),
    precoPromocional: Number(p.precoPromocional),
    status: p.status,
  }));
  const ordenadas =
    impulsionadas.size === 0
      ? promocoes
      : [...promocoes].sort(
          (a, b) => Number(impulsionadas.has(b.companyId)) - Number(impulsionadas.has(a.companyId))
        );
  return take ? ordenadas.slice(0, take) : ordenadas;
}

export async function getActiveCoupons(take?: number): Promise<Coupon[]> {
  const rows = await prisma.coupon.findMany({
    where: { status: "ativo" },
    orderBy: { createdAt: "desc" },
    include: { company: { select: { nomeFantasia: true, slug: true } } },
    ...(take ? { take } : {}),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((cp: any) => ({
    id: cp.id,
    companyId: cp.companyId,
    companyNome: cp.company.nomeFantasia,
    companySlug: cp.company.slug,
    titulo: cp.titulo,
    descricao: cp.descricao,
    codigo: cp.codigo,
    desconto: cp.desconto,
    validade: cp.validade instanceof Date ? cp.validade.toISOString() : String(cp.validade),
    limite: cp.limite,
    utilizados: cp.utilizados,
    status: cp.status,
    exclusivoClube: cp.exclusivoClube,
  }));
}
