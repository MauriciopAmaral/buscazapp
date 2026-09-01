import { Coupon } from "@/types";
import { companies, getClubPartners } from "./companies";

function iso(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

const couponTemplates: Omit<Coupon, "id" | "companyId">[] = [
  { titulo: "10% OFF na primeira compra", descricao: "Válido para novos clientes.", codigo: "BEMVINDO10", desconto: "10% OFF", validade: iso(30), limite: 200, utilizados: 87, status: "ativo" },
  { titulo: "Pizza Grande + Refri Grátis", descricao: "Ao pedir qualquer pizza grande.", codigo: "PIZZATOP", desconto: "Refri Grátis", validade: iso(15), limite: 100, utilizados: 64, status: "ativo" },
  { titulo: "R$20 OFF em Serviços Elétricos", descricao: "Para serviços acima de R$150.", codigo: "ELETRO20", desconto: "R$20 OFF", validade: iso(20), limite: 50, utilizados: 12, status: "ativo" },
  { titulo: "1 Mês Grátis na Matrícula Anual", descricao: "Fechando plano anual.", codigo: "ANOFIT", desconto: "1 Mês Grátis", validade: iso(45), limite: 30, utilizados: 9, status: "ativo" },
  { titulo: "Barba Grátis no Corte", descricao: "Na compra do corte masculino.", codigo: "BARBAFREE", desconto: "Barba Grátis", validade: iso(10), limite: 80, utilizados: 55, status: "ativo" },
  { titulo: "15% OFF em Peças", descricao: "Válido para peças de reposição.", codigo: "OFICINA15", desconto: "15% OFF", validade: iso(-5), limite: 60, utilizados: 60, status: "utilizado" },
  { titulo: "Exame Grátis no Check-up", descricao: "Um exame adicional gratuito.", codigo: "SAUDEPLUS", desconto: "Exame Grátis", validade: iso(25), limite: 40, utilizados: 5, status: "ativo" },
  { titulo: "5% OFF nas Compras do Mês", descricao: "Válido em toda a loja.", codigo: "ECONOMIA5", desconto: "5% OFF", validade: iso(-2), limite: 300, utilizados: 210, status: "expirado" },
  { titulo: "Hidratação Grátis", descricao: "Na escova progressiva.", codigo: "BELEZATOP", desconto: "Hidratação Grátis", validade: iso(12), limite: 25, utilizados: 8, status: "ativo" },
  { titulo: "20% OFF no Banho e Tosa", descricao: "Para pets de pequeno porte.", codigo: "PETLOVE20", desconto: "20% OFF", validade: iso(-10), limite: 40, utilizados: 22, status: "desativado" },
];

const targetCompanies = companies.filter((c) => c.reivindicada).slice(0, 10);

const baseCoupons: Coupon[] = couponTemplates.map((c, i) => ({
  ...c,
  id: `coupon-${i + 1}`,
  companyId: targetCompanies[i % targetCompanies.length].id,
}));

// Cupons exclusivos do BuscaZapp Clube — estilo "compre 1, leve 2" dos
// restaurantes/pizzarias parceiros do programa.
const clubTemplates: Omit<Coupon, "id" | "companyId">[] = [
  { titulo: "Compre 1, Leve 2 no Jantar", descricao: "Peça um prato principal e ganhe outro igual ou de menor valor. Válido de domingo a quinta.", codigo: "CLUBE2X1", desconto: "2 por 1", validade: iso(60), limite: 500, utilizados: 0, status: "ativo", exclusivoClube: true },
  { titulo: "50% OFF na Segunda Pizza", descricao: "Na compra de uma pizza grande, a segunda sai pela metade do preço.", codigo: "CLUBEPIZZA50", desconto: "50% OFF", validade: iso(60), limite: 500, utilizados: 0, status: "ativo", exclusivoClube: true },
];

const clubPartners = getClubPartners();
const clubCoupons: Coupon[] = clubPartners.map((company, i) => ({
  ...clubTemplates[i % clubTemplates.length],
  id: `coupon-clube-${i + 1}`,
  companyId: company.id,
}));

export const coupons: Coupon[] = [...baseCoupons, ...clubCoupons];

export function getCouponsByCompany(companyId: string) {
  return coupons.filter((c) => c.companyId === companyId);
}

export function getClubCoupons() {
  return coupons.filter((c) => c.exclusivoClube);
}
