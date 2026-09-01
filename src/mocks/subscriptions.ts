import { Plano, Subscription, Payment } from "@/types";
import { companies } from "./companies";

export const planos: Plano[] = [
  {
    id: "gratuito",
    nome: "Gratuito",
    precoMensal: 0,
    precoTrimestral: 0,
    precoAnual: 0,
    recursos: [
      "Perfil básico da empresa",
      "Até 3 fotos na galeria",
      "Receber avaliações",
      "1 cupom ativo por vez",
    ],
    assinantes: 842,
  },
  {
    id: "pro",
    nome: "Pro",
    precoMensal: 49.9,
    precoTrimestral: 134.9,
    precoAnual: 479.9,
    recursos: [
      "Tudo do Gratuito",
      "Galeria ilimitada",
      "Até 5 promoções ativas",
      "Até 5 cupons ativos",
      "Selo Verificado",
      "Estatísticas básicas",
    ],
    assinantes: 356,
  },
  {
    id: "premium",
    nome: "Premium",
    precoMensal: 99.9,
    precoTrimestral: 269.9,
    precoAnual: 959.9,
    destaque: true,
    recursos: [
      "Tudo do Pro",
      "Selo Premium",
      "Destaque nos resultados de busca",
      "Promoções e cupons ilimitados",
      "Estatísticas avançadas",
      "Suporte prioritário",
    ],
    assinantes: 198,
  },
  {
    id: "premium_plus",
    nome: "Premium+",
    precoMensal: 189.9,
    precoTrimestral: 509.9,
    precoAnual: 1799.9,
    recursos: [
      "Tudo do Premium",
      "Destaque na Home",
      "Anúncios patrocinados inclusos",
      "Gerente de conta dedicado",
      "Relatórios personalizados",
    ],
    assinantes: 64,
  },
];

const claimedCompanies = companies.filter((c) => c.reivindicada);

export const subscriptions: Subscription[] = claimedCompanies.map((c, i) => {
  const plano = planos.find((p) => p.id === c.planoId)!;
  const d = new Date();
  d.setDate(d.getDate() + ((i % 28) + 1));
  return {
    id: `sub-${i + 1}`,
    companyId: c.id,
    planoId: c.planoId,
    periodicidade: (["mensal", "trimestral", "anual"] as const)[i % 3],
    status: i % 11 === 0 ? "atrasada" : "ativa",
    proximaCobranca: d.toISOString(),
    valor: plano.precoMensal,
  };
});

export const payments: Payment[] = claimedCompanies.flatMap((c, ci) =>
  Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const plano = planos.find((p) => p.id === c.planoId)!;
    return {
      id: `pay-${ci}-${i}`,
      companyId: c.id,
      data: d.toISOString(),
      valor: plano.precoMensal,
      status: i === 0 && ci % 13 === 0 ? "pendente" : "pago",
      descricao: `Assinatura ${plano.nome} — referente a ${d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
    } as Payment;
  })
);

export function getSubscriptionByCompany(companyId: string) {
  return subscriptions.find((s) => s.companyId === companyId);
}

export function getPaymentsByCompany(companyId: string) {
  return payments.filter((p) => p.companyId === companyId);
}
