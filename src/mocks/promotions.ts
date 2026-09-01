import { Promotion } from "@/types";
import { companies } from "./companies";

function iso(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

const promoTemplates: Omit<Promotion, "id" | "companyId">[] = [
  { titulo: "Rodízio de Pizza em Dobro", descricao: "Leve 2 pague 1 no rodízio às terças-feiras.", imagemUrl: "https://picsum.photos/seed/promo1/500/300", inicio: iso(-10), termino: iso(20), preco: 89.9, precoPromocional: 44.9, status: "ativa" },
  { titulo: "Combo Executivo com 20% OFF", descricao: "Prato principal + suco + sobremesa.", imagemUrl: "https://picsum.photos/seed/promo2/500/300", inicio: iso(-5), termino: iso(15), preco: 39.9, precoPromocional: 31.9, status: "ativa" },
  { titulo: "Instalação Elétrica com Desconto", descricao: "10% de desconto em instalações residenciais completas.", imagemUrl: "https://picsum.photos/seed/promo3/500/300", inicio: iso(-3), termino: iso(27), preco: 500, precoPromocional: 450, status: "ativa" },
  { titulo: "Matrícula Gratuita", descricao: "Sem taxa de matrícula para novos alunos este mês.", imagemUrl: "https://picsum.photos/seed/promo4/500/300", inicio: iso(0), termino: iso(30), preco: 99.9, precoPromocional: 79.9, status: "ativa" },
  { titulo: "Corte + Barba com 15% OFF", descricao: "Combo completo com desconto especial.", imagemUrl: "https://picsum.photos/seed/promo5/500/300", inicio: iso(-2), termino: iso(10), preco: 60, precoPromocional: 51, status: "ativa" },
  { titulo: "Revisão Completa em Oferta", descricao: "Revisão de 40 itens com preço especial.", imagemUrl: "https://picsum.photos/seed/promo6/500/300", inicio: iso(-15), termino: iso(-1), preco: 250, precoPromocional: 189, status: "expirada" },
  { titulo: "Check-up com 25% OFF", descricao: "Pacote completo de exames laboratoriais.", imagemUrl: "https://picsum.photos/seed/promo7/500/300", inicio: iso(1), termino: iso(45), preco: 320, precoPromocional: 240, status: "agendada" },
  { titulo: "Compre 3 Pague 2 em Hortifruti", descricao: "Válido para frutas e verduras selecionadas.", imagemUrl: "https://picsum.photos/seed/promo8/500/300", inicio: iso(-7), termino: iso(7), preco: 30, precoPromocional: 20, status: "ativa" },
  { titulo: "Escova + Hidratação com Desconto", descricao: "Pacote de beleza completo.", imagemUrl: "https://picsum.photos/seed/promo9/500/300", inicio: iso(-1), termino: iso(20), preco: 120, precoPromocional: 89, status: "ativa" },
  { titulo: "Banho e Tosa com 30% OFF", descricao: "Para cães de pequeno e médio porte.", imagemUrl: "https://picsum.photos/seed/promo10/500/300", inicio: iso(-20), termino: iso(-5), preco: 80, precoPromocional: 56, status: "expirada" },
];

const targetCompanies = companies.filter((c) => c.premium || c.reivindicada).slice(0, 10);

export const promotions: Promotion[] = promoTemplates.map((p, i) => ({
  ...p,
  id: `promo-${i + 1}`,
  companyId: targetCompanies[i % targetCompanies.length].id,
}));

export function getPromotionsByCompany(companyId: string) {
  return promotions.filter((p) => p.companyId === companyId);
}
