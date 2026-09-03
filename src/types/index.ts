// ============================================================
// BuscaZapp — Tipos centrais do domínio
// Esta camada representa o "contrato" que futuramente será
// espelhado pela API real. Nenhum dado aqui é real.
// ============================================================

export type PlanoId = "gratuito" | "pro" | "premium" | "premium_plus";

export interface Plano {
  id: PlanoId;
  nome: string;
  precoMensal: number;
  precoTrimestral: number;
  precoAnual: number;
  destaque?: boolean;
  recursos: string[];
  assinantes: number;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
}

export interface HorarioDia {
  dia:
    | "segunda"
    | "terca"
    | "quarta"
    | "quinta"
    | "sexta"
    | "sabado"
    | "domingo";
  aberto: boolean;
  inicio?: string;
  fim?: string;
}

export interface Category {
  id: string;
  slug: string;
  nome: string;
  icone: string;
  descricao?: string;
  categoriaPaiId?: string | null;
  ativo: boolean;
  totalEmpresas: number;
}

export interface ReviewReply {
  texto: string;
  data: string;
}

export interface Review {
  id: string;
  companyId: string;
  autor: string;
  avatarUrl?: string;
  nota: number; // 1-5
  comentario: string;
  data: string;
  resposta?: ReviewReply;
}

export interface Product {
  id: string;
  companyId: string;
  imagemUrl: string;
  nome: string;
  descricao: string;
  preco: number;
  precoPromocional?: number;
  ativo: boolean;
}

export interface Service {
  id: string;
  companyId: string;
  nome: string;
  descricao: string;
  precoInicial: number;
  imagemUrl: string;
}

export type PromotionStatus = "ativa" | "agendada" | "expirada" | "desativada";

export interface Promotion {
  id: string;
  companyId: string;
  /** Presente quando a promoção vem da API/banco — evita ter que procurar a empresa nos mocks. */
  companyNome?: string;
  companySlug?: string;
  titulo: string;
  descricao: string;
  imagemUrl: string;
  inicio: string;
  termino: string;
  preco: number;
  precoPromocional: number;
  status: PromotionStatus;
}

export type CouponStatus = "ativo" | "expirado" | "utilizado" | "desativado";

export interface Coupon {
  id: string;
  companyId: string;
  /** Presente quando o cupom vem da API/banco — evita ter que procurar a empresa nos mocks. */
  companyNome?: string;
  companySlug?: string;
  titulo: string;
  descricao: string;
  codigo: string;
  desconto: string; // ex "20% OFF"
  validade: string;
  limite: number;
  utilizados: number;
  status: CouponStatus;
  /** Cupom exclusivo para assinantes do BuscaZapp Clube. */
  exclusivoClube?: boolean;
}

export interface Company {
  id: string;
  slug: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  logoUrl: string;
  capaUrl: string;
  categoriaId: string;
  categoriaNome: string;
  descricao: string;
  telefone: string;
  whatsapp: string;
  email?: string;
  instagram?: string;
  site?: string;
  endereco: Endereco;
  horarios: HorarioDia[];
  galeria: string[];
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  verificado: boolean;
  premium: boolean;
  planoId: PlanoId;
  reivindicada: boolean;
  patrocinada?: boolean;
  status: "ativo" | "pendente" | "suspenso";
  criadoEm: string;
  /** Faz parte do BuscaZapp Clube (programa de benefícios em restaurantes, estilo "compre 1 leve 2"). */
  clubeParceiro?: boolean;
  /** % de cashback que o cliente recebe de volta ao comprar nesta empresa (0 = sem cashback). */
  cashbackPercentual?: number;
}

export type UserRole = "consumidor" | "empresa" | "admin";

export interface User {
  id: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  companyId?: string;
  companyNome?: string;
  companySlug?: string;
  criadoEm: string;
  /** Saldo acumulado de cashback (R$), disponível para uso em novas compras. */
  saldoCashback?: number;
  /** Assinante do BuscaZapp Clube. */
  clubeAssinante?: boolean;
}

export type CashbackStatus = "creditado" | "pendente" | "resgatado";

export interface CashbackTransaction {
  id: string;
  userId: string;
  companyId: string;
  companyNome: string;
  data: string;
  valorCompra: number;
  percentual: number;
  valorCashback: number;
  status: CashbackStatus;
}

export interface Subscription {
  id: string;
  companyId: string;
  /** Presentes quando a assinatura vem da API/banco — evita ter que procurar nos mocks. */
  companyNome?: string;
  companySlug?: string;
  planoNome?: string;
  planoId: PlanoId;
  periodicidade: "mensal" | "trimestral" | "anual";
  status: "ativa" | "cancelada" | "atrasada";
  proximaCobranca: string;
  valor: number;
}

export interface Payment {
  id: string;
  companyId: string;
  /** Presentes quando o pagamento vem da API/banco — evita ter que procurar nos mocks. */
  companyNome?: string;
  companySlug?: string;
  companyWhatsapp?: string;
  data: string;
  valor: number;
  status: "pago" | "pendente" | "falhou";
  descricao: string;
}

export interface AnalyticsPoint {
  data: string;
  visualizacoes: number;
  cliquesWhatsapp: number;
  leads: number;
  cuponsUtilizados: number;
}

export interface CompanyAnalytics {
  companyId: string;
  visualizacoes: number;
  cliquesWhatsapp: number;
  leads: number;
  cuponsUtilizados: number;
  avaliacao: number;
  serieDiaria: AnalyticsPoint[];
}

export type LeadOrigem = "whatsapp" | "telefone" | "cupom" | "site";

export interface Lead {
  id: string;
  companyId: string;
  data: string;
  origem: LeadOrigem;
  tipo: string;
  acao: string;
}

export type ClaimStatus =
  | "novo"
  | "aguardando_validacao"
  | "em_analise"
  | "aprovado"
  | "rejeitado";

export interface Claim {
  id: string;
  companyId: string;
  companyNome: string;
  usuario: string;
  metodo: "email" | "telefone" | "documento";
  data: string;
  status: ClaimStatus;
}

export type ProspectStatus =
  | "novo"
  | "contatado"
  | "interessado"
  | "reivindicado"
  | "assinante"
  | "nao_interessado";

export interface Prospect {
  id: string;
  companyId: string;
  companyNome: string;
  cidade: string;
  telefone: string;
  status: ProspectStatus;
  ultimoContato?: string;
}

export interface Ad {
  id: string;
  tipo:
    | "destaque_home"
    | "destaque_categoria"
    | "destaque_cidade"
    | "resultado_patrocinado"
    | "promocao_destacada";
  companyId: string;
  companyNome: string;
  companySlug?: string;
  cidade: string;
  inicio: string;
  termino: string;
  status: "ativo" | "pausado" | "encerrado";
  cliques: number;
  impressoes: number;
}

export interface City {
  id: string;
  nome: string;
  estado: string;
  totalEmpresas: number;
}

export interface Neighborhood {
  id: string;
  nome: string;
  cidadeId: string;
}
