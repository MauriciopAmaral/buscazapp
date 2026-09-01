import { Company, HorarioDia } from "@/types";
import { legacyCompanies } from "./legacyCompanies";

const diasSemana: HorarioDia["dia"][] = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
];

function horarioPadrao(fechaDomingo = true): HorarioDia[] {
  return diasSemana.map((dia) => {
    if (dia === "domingo" && fechaDomingo) {
      return { dia, aberto: false };
    }
    if (dia === "sabado") {
      return { dia, aberto: true, inicio: "09:00", fim: "13:00" };
    }
    return { dia, aberto: true, inicio: "08:00", fim: "18:00" };
  });
}

function placeholderImg(seed: string, w = 400, h = 300) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

// Coordenadas aproximadas do centro de cada cidade paraense usada no protótipo.
const cityCoords: Record<string, { lat: number; lng: number }> = {
  Belém: { lat: -1.4558, lng: -48.4902 },
  Ananindeua: { lat: -1.3656, lng: -48.3722 },
  Castanhal: { lat: -1.2937, lng: -47.9264 },
  Marituba: { lat: -1.3406, lng: -48.3428 },
  Benevides: { lat: -1.3608, lng: -48.2444 },
};

// Pequeno deslocamento determinístico (sem Math.random) para espalhar as
// empresas de uma mesma cidade em bairros/pontos diferentes no mapa.
function jitterCoord(base: number, seedIndex: number, spread = 0.03) {
  const pseudo = Math.sin(seedIndex * 12.9898) * 43758.5453;
  const frac = pseudo - Math.floor(pseudo); // 0..1 determinístico
  return base + (frac - 0.5) * spread;
}

interface RawCompany {
  nomeFantasia: string;
  razaoSocial: string;
  categoriaId: string;
  categoriaNome: string;
  cidade: string;
  bairro: string;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  verificado: boolean;
  premium: boolean;
  reivindicada: boolean;
  patrocinada?: boolean;
  planoId: Company["planoId"];
  descricao: string;
  clubeParceiro?: boolean;
  cashbackPercentual?: number;
}

const raw: RawCompany[] = [
  { nomeFantasia: "Pizzaria Titan", razaoSocial: "Titan Alimentos LTDA", categoriaId: "cat-2", categoriaNome: "Pizzarias", cidade: "Belém", bairro: "Nazaré", avaliacaoMedia: 4.8, totalAvaliacoes: 312, verificado: true, premium: true, reivindicada: true, patrocinada: true, planoId: "premium_plus", descricao: "As melhores pizzas artesanais de Belém, com massa de fermentação natural e ingredientes selecionados.", clubeParceiro: true, cashbackPercentual: 5 },
  { nomeFantasia: "Sabor do Pará Restaurante", razaoSocial: "Sabor Paraense Comércio de Alimentos LTDA", categoriaId: "cat-1", categoriaNome: "Restaurantes", cidade: "Belém", bairro: "Batista Campos", avaliacaoMedia: 4.7, totalAvaliacoes: 289, verificado: true, premium: true, reivindicada: true, patrocinada: true, planoId: "premium", descricao: "Culinária regional paraense com tucupi, açaí e peixes frescos direto do rio.", clubeParceiro: true, cashbackPercentual: 6 },
  { nomeFantasia: "Eletricista Amazônia 24h", razaoSocial: "Amazônia Serviços Elétricos LTDA", categoriaId: "cat-3", categoriaNome: "Eletricistas", cidade: "Belém", bairro: "Marco", avaliacaoMedia: 4.6, totalAvaliacoes: 154, verificado: true, premium: false, reivindicada: true, planoId: "pro", descricao: "Atendimento elétrico residencial e comercial 24 horas, com garantia de serviço.", cashbackPercentual: 3 },
  { nomeFantasia: "Academia Fit Belém", razaoSocial: "Fit Belém Academia LTDA", categoriaId: "cat-4", categoriaNome: "Academias", cidade: "Belém", bairro: "Umarizal", avaliacaoMedia: 4.5, totalAvaliacoes: 201, verificado: true, premium: true, reivindicada: true, patrocinada: true, planoId: "premium", descricao: "Estrutura completa com musculação, crossfit e aulas coletivas todos os dias.", cashbackPercentual: 4 },
  { nomeFantasia: "Barbearia Trato Fino", razaoSocial: "Trato Fino Barbearia LTDA", categoriaId: "cat-5", categoriaNome: "Barbearias", cidade: "Belém", bairro: "Cidade Velha", avaliacaoMedia: 4.9, totalAvaliacoes: 178, verificado: true, premium: true, reivindicada: true, planoId: "premium", descricao: "Cortes modernos, barba na navalha e ambiente climatizado no coração de Belém.", cashbackPercentual: 8 },
  { nomeFantasia: "Oficina Motor Norte", razaoSocial: "Motor Norte Serviços Automotivos LTDA", categoriaId: "cat-6", categoriaNome: "Oficinas Mecânicas", cidade: "Belém", bairro: "Pedreira", avaliacaoMedia: 4.4, totalAvaliacoes: 98, verificado: true, premium: false, reivindicada: true, planoId: "pro", descricao: "Manutenção preventiva e corretiva para todas as marcas, com diagnóstico computadorizado." },
  { nomeFantasia: "Clínica Vida Saudável", razaoSocial: "Vida Saudável Clínica Médica LTDA", categoriaId: "cat-7", categoriaNome: "Clínicas", cidade: "Belém", bairro: "Reduto", avaliacaoMedia: 4.7, totalAvaliacoes: 143, verificado: true, premium: true, reivindicada: true, planoId: "premium_plus", descricao: "Clínica multidisciplinar com atendimento em clínica geral, pediatria e ginecologia.", cashbackPercentual: 5 },
  { nomeFantasia: "Mercado Bom Preço", razaoSocial: "Bom Preço Comércio de Alimentos LTDA", categoriaId: "cat-8", categoriaNome: "Mercados", cidade: "Belém", bairro: "Guamá", avaliacaoMedia: 4.2, totalAvaliacoes: 87, verificado: false, premium: false, reivindicada: true, planoId: "gratuito", descricao: "Hortifruti, açougue e mercearia com os melhores preços da região." },
  { nomeFantasia: "Studio Beleza & Cia", razaoSocial: "Beleza & Cia Salão LTDA", categoriaId: "cat-9", categoriaNome: "Salão de Beleza", cidade: "Belém", bairro: "Marco", avaliacaoMedia: 4.6, totalAvaliacoes: 165, verificado: true, premium: true, reivindicada: true, planoId: "premium", descricao: "Cabelo, unhas, estética facial e corporal com profissionais especializados.", cashbackPercentual: 6 },
  { nomeFantasia: "Pet Amigo Fiel", razaoSocial: "Amigo Fiel Pet Shop LTDA", categoriaId: "cat-10", categoriaNome: "Pet Shops", cidade: "Belém", bairro: "Telégrafo", avaliacaoMedia: 4.8, totalAvaliacoes: 112, verificado: true, premium: false, reivindicada: true, planoId: "pro", descricao: "Banho, tosa, vacinas e produtos para o seu melhor amigo.", cashbackPercentual: 4 },
  { nomeFantasia: "Pizzaria Bella Napoli", razaoSocial: "Bella Napoli Alimentos LTDA", categoriaId: "cat-2", categoriaNome: "Pizzarias", cidade: "Ananindeua", bairro: "Coqueiro", avaliacaoMedia: 4.5, totalAvaliacoes: 134, verificado: true, premium: false, reivindicada: true, planoId: "pro", descricao: "Pizza no estilo italiano com forno a lenha e ingredientes importados.", clubeParceiro: true, cashbackPercentual: 5 },
  { nomeFantasia: "Restaurante Sabor Caseiro", razaoSocial: "Sabor Caseiro Refeições LTDA", categoriaId: "cat-1", categoriaNome: "Restaurantes", cidade: "Ananindeua", bairro: "Icuí Guajará", avaliacaoMedia: 4.3, totalAvaliacoes: 76, verificado: false, premium: false, reivindicada: false, planoId: "gratuito", descricao: "Buffet self-service com comida caseira e sobremesas regionais." },
  { nomeFantasia: "Eletricista Cabo & Cia", razaoSocial: "Cabo & Cia Instalações Elétricas LTDA", categoriaId: "cat-3", categoriaNome: "Eletricistas", cidade: "Ananindeua", bairro: "Águas Lindas", avaliacaoMedia: 4.4, totalAvaliacoes: 58, verificado: true, premium: false, reivindicada: true, planoId: "gratuito", descricao: "Instalações elétricas residenciais e comerciais com orçamento sem compromisso." },
  { nomeFantasia: "Academia Corpo & Cia", razaoSocial: "Corpo & Cia Academia LTDA", categoriaId: "cat-4", categoriaNome: "Academias", cidade: "Ananindeua", bairro: "Centro", avaliacaoMedia: 4.6, totalAvaliacoes: 199, verificado: true, premium: true, reivindicada: true, patrocinada: true, planoId: "premium", descricao: "Musculação, spinning e personal trainer em um espaço amplo e moderno.", cashbackPercentual: 4 },
  { nomeFantasia: "Barbearia Estilo Urbano", razaoSocial: "Estilo Urbano Barbearia LTDA", categoriaId: "cat-5", categoriaNome: "Barbearias", cidade: "Ananindeua", bairro: "Aurá", avaliacaoMedia: 4.7, totalAvaliacoes: 91, verificado: true, premium: false, reivindicada: true, planoId: "pro", descricao: "Ambiente descontraído com cortes clássicos e modernos." },
  { nomeFantasia: "Oficina Rápida Ananindeua", razaoSocial: "Rápida Serviços Automotivos LTDA", categoriaId: "cat-6", categoriaNome: "Oficinas Mecânicas", cidade: "Ananindeua", bairro: "Curuçambá", avaliacaoMedia: 4.1, totalAvaliacoes: 45, verificado: false, premium: false, reivindicada: false, planoId: "gratuito", descricao: "Troca de óleo, freios e suspensão com atendimento rápido." },
  { nomeFantasia: "Clínica Saúde Total", razaoSocial: "Saúde Total Clínica LTDA", categoriaId: "cat-7", categoriaNome: "Clínicas", cidade: "Ananindeua", bairro: "Cidade Nova", avaliacaoMedia: 4.5, totalAvaliacoes: 120, verificado: true, premium: true, reivindicada: true, planoId: "premium", descricao: "Consultas, exames laboratoriais e check-up completo.", cashbackPercentual: 5 },
  { nomeFantasia: "Mercado Economia Já", razaoSocial: "Economia Já Comércio LTDA", categoriaId: "cat-8", categoriaNome: "Mercados", cidade: "Ananindeua", bairro: "Distrito Industrial", avaliacaoMedia: 4.0, totalAvaliacoes: 63, verificado: false, premium: false, reivindicada: true, planoId: "gratuito", descricao: "Ofertas semanais em mercearia, bebidas e limpeza." },
  { nomeFantasia: "Espaço Beleza Real", razaoSocial: "Beleza Real Studio LTDA", categoriaId: "cat-9", categoriaNome: "Salão de Beleza", cidade: "Castanhal", bairro: "Centro", avaliacaoMedia: 4.6, totalAvaliacoes: 88, verificado: true, premium: false, reivindicada: true, planoId: "pro", descricao: "Tratamentos capilares, maquiagem e design de sobrancelhas." },
  { nomeFantasia: "Pet Center Castanhal", razaoSocial: "Pet Center Castanhal LTDA", categoriaId: "cat-10", categoriaNome: "Pet Shops", cidade: "Castanhal", bairro: "Jaderlândia", avaliacaoMedia: 4.7, totalAvaliacoes: 71, verificado: true, premium: false, reivindicada: true, planoId: "pro", descricao: "Loja completa com banho, tosa e clínica veterinária." },
  { nomeFantasia: "Restaurante Point do Peixe", razaoSocial: "Point do Peixe Alimentos LTDA", categoriaId: "cat-1", categoriaNome: "Restaurantes", cidade: "Castanhal", bairro: "Centro", avaliacaoMedia: 4.8, totalAvaliacoes: 156, verificado: true, premium: true, reivindicada: true, patrocinada: true, planoId: "premium_plus", descricao: "Especialidade em peixes amazônicos e frutos do mar frescos.", clubeParceiro: true, cashbackPercentual: 7 },
  { nomeFantasia: "Pizzaria Fornalha", razaoSocial: "Fornalha Pizzas LTDA", categoriaId: "cat-2", categoriaNome: "Pizzarias", cidade: "Castanhal", bairro: "São José", avaliacaoMedia: 4.4, totalAvaliacoes: 67, verificado: false, premium: false, reivindicada: false, planoId: "gratuito", descricao: "Pizzas grandes e saborosas para toda a família." },
  { nomeFantasia: "Móveis Bom Lar", razaoSocial: "Bom Lar Móveis e Decoração LTDA", categoriaId: "cat-11", categoriaNome: "Móveis e Decoração", cidade: "Castanhal", bairro: "Centro", avaliacaoMedia: 4.3, totalAvaliacoes: 54, verificado: true, premium: false, reivindicada: true, planoId: "gratuito", descricao: "Móveis planejados e decoração para todos os ambientes." },
  { nomeFantasia: "Moda Style Castanhal", razaoSocial: "Style Moda e Vestuário LTDA", categoriaId: "cat-12", categoriaNome: "Moda e Vestuário", cidade: "Castanhal", bairro: "Centro", avaliacaoMedia: 4.2, totalAvaliacoes: 39, verificado: false, premium: false, reivindicada: false, planoId: "gratuito", descricao: "Roupas femininas e masculinas com as últimas tendências." },
  { nomeFantasia: "Escritório Advocacia Marituba", razaoSocial: "Advocacia Marituba Sociedade LTDA", categoriaId: "cat-13", categoriaNome: "Advocacia", cidade: "Marituba", bairro: "Centro", avaliacaoMedia: 4.9, totalAvaliacoes: 42, verificado: true, premium: true, reivindicada: true, planoId: "premium", descricao: "Advocacia trabalhista, cível e previdenciária com atendimento personalizado.", cashbackPercentual: 3 },
  { nomeFantasia: "Informática Rede Norte", razaoSocial: "Rede Norte Informática LTDA", categoriaId: "cat-14", categoriaNome: "Informática e Celulares", cidade: "Marituba", bairro: "Centro", avaliacaoMedia: 4.5, totalAvaliacoes: 61, verificado: true, premium: false, reivindicada: true, planoId: "pro", descricao: "Assistência técnica em computadores e celulares com garantia.", cashbackPercentual: 4 },
  { nomeFantasia: "Construtora Reforma Fácil", razaoSocial: "Reforma Fácil Construções LTDA", categoriaId: "cat-15", categoriaNome: "Construção e Reforma", cidade: "Marituba", bairro: "Distrito Industrial", avaliacaoMedia: 4.6, totalAvaliacoes: 33, verificado: true, premium: false, reivindicada: true, planoId: "gratuito", descricao: "Reformas residenciais e comerciais com equipe própria." },
  { nomeFantasia: "Academia Marituba Power", razaoSocial: "Marituba Power Academia LTDA", categoriaId: "cat-4", categoriaNome: "Academias", cidade: "Marituba", bairro: "Centro", avaliacaoMedia: 4.3, totalAvaliacoes: 48, verificado: false, premium: false, reivindicada: false, planoId: "gratuito", descricao: "Musculação e aulas coletivas com mensalidades acessíveis." },
  { nomeFantasia: "Restaurante Sabor de Benevides", razaoSocial: "Sabor de Benevides Alimentos LTDA", categoriaId: "cat-1", categoriaNome: "Restaurantes", cidade: "Benevides", bairro: "Centro", avaliacaoMedia: 4.4, totalAvaliacoes: 29, verificado: true, premium: false, reivindicada: true, planoId: "pro", descricao: "Pratos regionais com atendimento familiar.", clubeParceiro: true, cashbackPercentual: 6 },
  { nomeFantasia: "Barbearia Corte Real Benevides", razaoSocial: "Corte Real Barbearia LTDA", categoriaId: "cat-5", categoriaNome: "Barbearias", cidade: "Benevides", bairro: "Centro", avaliacaoMedia: 4.5, totalAvaliacoes: 22, verificado: false, premium: false, reivindicada: false, planoId: "gratuito", descricao: "Cortes tradicionais e modernos com preço justo." },
];

const paraCompanies: Company[] = raw.map((r, i) => {
  const slugBase = r.nomeFantasia
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const id = `comp-${i + 1}`;
  return {
    id,
    slug: slugBase,
    nomeFantasia: r.nomeFantasia,
    razaoSocial: r.razaoSocial,
    cnpj: `0${(i + 1).toString().padStart(2, "0")}.${(345 + i)
      .toString()
      .padStart(3, "0")}.${(678 + i).toString().padStart(3, "0")}/0001-${(10 + i)
      .toString()
      .padStart(2, "0")}`,
    logoUrl: placeholderImg(`${slugBase}-logo`, 200, 200),
    capaUrl: placeholderImg(`${slugBase}-capa`, 1200, 400),
    categoriaId: r.categoriaId,
    categoriaNome: r.categoriaNome,
    descricao: r.descricao,
    telefone: `(91) 3${(200 + i).toString()}-${(1000 + i * 7).toString().slice(0, 4)}`,
    whatsapp: `5591${(981000000 + i * 1234).toString()}`,
    email: `contato@${slugBase.replace(/-/g, "")}.com.br`,
    instagram: `@${slugBase.replace(/-/g, "")}`,
    site: r.premium ? `https://${slugBase.replace(/-/g, "")}.com.br` : undefined,
    endereco: {
      cep: `66${(600 + i).toString().padStart(3, "0")}-${(100 + i).toString().slice(0, 3)}`,
      logradouro: `Travessa ${["Padre Eutíquio", "Quintino Bocaiúva", "Bernal do Couto", "Municipalidade", "São Pedro"][i % 5]}`,
      numero: `${100 + i * 3}`,
      complemento: i % 4 === 0 ? "Sala 2" : undefined,
      bairro: r.bairro,
      cidade: r.cidade,
      estado: "PA",
      latitude: jitterCoord(cityCoords[r.cidade].lat, i * 2 + 1),
      longitude: jitterCoord(cityCoords[r.cidade].lng, i * 2 + 2),
    },
    horarios: horarioPadrao(i % 5 !== 0),
    galeria: [
      placeholderImg(`${slugBase}-g1`),
      placeholderImg(`${slugBase}-g2`),
      placeholderImg(`${slugBase}-g3`),
      placeholderImg(`${slugBase}-g4`),
    ],
    avaliacaoMedia: r.avaliacaoMedia,
    totalAvaliacoes: r.totalAvaliacoes,
    verificado: r.verificado,
    premium: r.premium,
    planoId: r.planoId,
    reivindicada: r.reivindicada,
    patrocinada: r.patrocinada,
    status: "ativo",
    criadoEm: new Date(2025, i % 12, (i % 27) + 1).toISOString(),
    clubeParceiro: r.clubeParceiro ?? false,
    cashbackPercentual: r.cashbackPercentual ?? 0,
  };
});

// Empresas paraenses fictícias do protótipo + empresas importadas do banco
// antigo (ver src/mocks/legacyCompanies.ts para o contexto da importação).
export const companies: Company[] = [...paraCompanies, ...legacyCompanies];

export function getCompanyBySlug(slug: string) {
  return companies.find((c) => c.slug === slug);
}

export function getCompaniesByCategory(categoriaId: string) {
  return companies.filter((c) => c.categoriaId === categoriaId);
}

export function getCompaniesByCity(cidade: string) {
  return companies.filter((c) => c.endereco.cidade === cidade);
}

const cidadesParaFixas = ["Belém", "Ananindeua", "Castanhal", "Marituba", "Benevides"];

// Lista de cidades pra filtro de busca: as 5 cidades paraenses do foco
// original do protótipo, seguidas de qualquer outra cidade que apareça
// nos dados (hoje, as cidades vindas da importação do banco antigo).
export const cidadesPara = Array.from(
  new Set([...cidadesParaFixas, ...companies.map((c) => c.endereco.cidade)])
);

export function getClubPartners() {
  return companies.filter((c) => c.clubeParceiro);
}

export function getCashbackCompanies() {
  return companies.filter((c) => (c.cashbackPercentual ?? 0) > 0);
}
