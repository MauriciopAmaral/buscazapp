// ============================================================
// Importação do banco antigo (Postgres/Neon) do BuscaZapp.
//
// Esses 6 registros vieram do dump `buscazapbackup20260823.dump`
// enviado pelo cliente. São os únicos dados que existiam de fato
// nesse banco antigo — o restante (usuários reais, assinaturas,
// pagamentos) estava vazio. Os próprios IDs de origem (`clseedad...`,
// `clseedprovider...`) indicam que é o conjunto de demonstração
// criado quando o projeto foi iniciado, não uma base de empresas
// paraenses cadastradas de verdade.
//
// Ainda assim, a orientação foi trazer esse conteúdo para dentro do
// projeto novo e deixar o dono da conta ("Demo Prestador") atualizar
// os dados depois, já usando o painel real. Por isso vários campos
// que não existiam no banco antigo (CNPJ, endereço completo, fotos,
// horário) vêm com placeholder e precisam ser revisados.
//
// IMPORTANTE: o modelo antigo permitia 1 conta (Provider) dona de
// N anúncios (Advertisement) — aqui o "Demo Prestador" tem 6. O
// nosso modelo atual (User -> 1 Company) só suporta uma empresa por
// usuário, então por enquanto vinculamos o usuário só ao primeiro
// anúncio. Precisa virar suporte a múltiplas empresas por conta
// quando entrarmos na API real, se o cliente realmente administra
// vários negócios com o mesmo login.

import { Company } from "@/types";

function placeholderImg(seed: string, w = 400, h = 300) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function horarioPadrao() {
  return [
    { dia: "segunda" as const, aberto: true, inicio: "08:00", fim: "18:00" },
    { dia: "terca" as const, aberto: true, inicio: "08:00", fim: "18:00" },
    { dia: "quarta" as const, aberto: true, inicio: "08:00", fim: "18:00" },
    { dia: "quinta" as const, aberto: true, inicio: "08:00", fim: "18:00" },
    { dia: "sexta" as const, aberto: true, inicio: "08:00", fim: "18:00" },
    { dia: "sabado" as const, aberto: true, inicio: "09:00", fim: "13:00" },
    { dia: "domingo" as const, aberto: false },
  ];
}

// Dados originais do Provider dono dos 6 anúncios (tabela public.Provider).
export const legacyProvider = {
  id: "clseedprovider000001",
  nome: "Demo Prestador",
  email: "demo@buscazap.com.br",
  whatsapp: "5511999999999",
  // Hash bcrypt real, preservado do banco antigo — não é o padrão "123456"
  // usado pelos demais usuários de demonstração. Usado em prisma/seed.ts.
  senhaHashOriginal: "$2a$10$9o0SLK37MZ2uQE..FQ47p.hANgIW0nFCvuKOHUN0oMtnpJLMACNPC",
  criadoEm: "2026-07-06T14:00:55.896Z",
};

interface LegacyAd {
  id: string;
  titulo: string;
  descricao: string;
  categoriaId: string;
  categoriaNome: string;
  cidade: string;
  estado: string;
  bairro: string;
  whatsapp: string;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  criadoEm: string;
}

// Coordenadas aproximadas do centro de cada cidade (fora do Pará).
const cidadeCoords: Record<string, { lat: number; lng: number }> = {
  "São Paulo": { lat: -23.5505, lng: -46.6333 },
  "Rio de Janeiro": { lat: -22.9068, lng: -43.1729 },
  "Belo Horizonte": { lat: -19.9167, lng: -43.9345 },
  Curitiba: { lat: -25.4284, lng: -49.2733 },
  Brasília: { lat: -15.7939, lng: -47.8828 },
  Salvador: { lat: -12.9777, lng: -38.5016 },
};

// category (texto livre no banco antigo) -> categoria do BuscaZapp novo.
const legacyAds: LegacyAd[] = [
  {
    id: "clseedad000001",
    titulo: "Dr. Carlos Mendes - Cardiologista",
    descricao: "Consultas cardiológicas com atendimento humanizado e equipamentos modernos.",
    categoriaId: "cat-7",
    categoriaNome: "Clínicas",
    cidade: "São Paulo",
    estado: "SP",
    bairro: "Moema",
    whatsapp: "5511999887766",
    avaliacaoMedia: 4.9,
    totalAvaliacoes: 127,
    criadoEm: "2026-06-28T14:00:55.971Z",
  },
  {
    id: "clseedad000002",
    titulo: "TechFix Assistência Técnica",
    descricao: "Conserto de celulares, notebooks e tablets. Atendimento em domicílio.",
    categoriaId: "cat-14",
    categoriaNome: "Informática e Celulares",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    bairro: "Copacabana",
    whatsapp: "5521988776655",
    avaliacaoMedia: 4.7,
    totalAvaliacoes: 89,
    criadoEm: "2026-07-01T14:00:55.971Z",
  },
  {
    id: "clseedad000003",
    titulo: "Sabor & Arte Restaurante",
    descricao: "Comida caseira com ingredientes frescos. Delivery e retirada.",
    categoriaId: "cat-1",
    categoriaNome: "Restaurantes",
    cidade: "Belo Horizonte",
    estado: "MG",
    bairro: "Savassi",
    whatsapp: "5531977665544",
    avaliacaoMedia: 4.8,
    totalAvaliacoes: 234,
    criadoEm: "2026-06-25T14:00:55.971Z",
  },
  {
    id: "clseedad000004",
    titulo: "Móveis Planejados Silva",
    descricao: "Projetos personalizados para cozinhas, quartos e escritórios.",
    categoriaId: "cat-15",
    categoriaNome: "Construção e Reforma",
    cidade: "Curitiba",
    estado: "PR",
    bairro: "Batel",
    whatsapp: "5541966554433",
    avaliacaoMedia: 4.6,
    totalAvaliacoes: 56,
    criadoEm: "2026-07-02T14:00:55.971Z",
  },
  {
    id: "clseedad000005",
    titulo: "Studio Bella - Estética",
    descricao: "Tratamentos faciais, corporais e design de sobrancelhas.",
    categoriaId: "cat-9",
    categoriaNome: "Salão de Beleza",
    cidade: "Brasília",
    estado: "DF",
    bairro: "Asa Sul",
    whatsapp: "5561855443322",
    avaliacaoMedia: 5,
    totalAvaliacoes: 178,
    criadoEm: "2026-06-30T14:00:55.971Z",
  },
  {
    id: "clseedad000006",
    titulo: "Auto Center Premium",
    descricao: "Mecânica geral, funilaria e pintura automotiva.",
    categoriaId: "cat-6",
    categoriaNome: "Oficinas Mecânicas",
    cidade: "Salvador",
    estado: "BA",
    bairro: "Pituba",
    whatsapp: "5571944332211",
    avaliacaoMedia: 4.5,
    totalAvaliacoes: 92,
    criadoEm: "2026-07-01T14:00:55.971Z",
  },
];

export const legacyCompanies: Company[] = legacyAds.map((ad, i) => {
  const slug = ad.titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const coords = cidadeCoords[ad.cidade];
  return {
    id: `legacy-${i + 1}`,
    slug,
    nomeFantasia: ad.titulo,
    // Sem razão social/CNPJ no banco antigo — placeholder até o dono confirmar.
    razaoSocial: ad.titulo,
    cnpj: `00.000.00${i + 1}/0001-00`,
    logoUrl: placeholderImg(`${slug}-logo`, 200, 200),
    capaUrl: placeholderImg(`${slug}-capa`, 1200, 400),
    categoriaId: ad.categoriaId,
    categoriaNome: ad.categoriaNome,
    descricao: ad.descricao,
    telefone: ad.whatsapp,
    whatsapp: ad.whatsapp,
    instagram: undefined,
    site: undefined,
    endereco: {
      cep: "",
      logradouro: "A definir",
      numero: "S/N",
      bairro: ad.bairro,
      cidade: ad.cidade,
      estado: ad.estado,
      latitude: coords?.lat ?? 0,
      longitude: coords?.lng ?? 0,
    },
    horarios: horarioPadrao(),
    galeria: [placeholderImg(`${slug}-g1`), placeholderImg(`${slug}-g2`)],
    avaliacaoMedia: ad.avaliacaoMedia,
    totalAvaliacoes: ad.totalAvaliacoes,
    verificado: true,
    // Assinatura premium do banco antigo já estava vencida — volta como gratuito
    // até o cliente reativar um plano pelo painel novo.
    premium: false,
    planoId: "gratuito",
    reivindicada: true,
    patrocinada: false,
    status: "ativo",
    criadoEm: ad.criadoEm,
    clubeParceiro: false,
    cashbackPercentual: 0,
  };
});
