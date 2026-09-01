import { AnalyticsPoint, CompanyAnalytics, Lead, LeadOrigem } from "@/types";
import { companies } from "./companies";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildSerie(seed: number): AnalyticsPoint[] {
  const points: AnalyticsPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const r = seededRandom(seed + i);
    points.push({
      data: d.toISOString().slice(0, 10),
      visualizacoes: Math.round(20 + r * 60),
      cliquesWhatsapp: Math.round(4 + r * 15),
      leads: Math.round(1 + r * 6),
      cuponsUtilizados: Math.round(r * 4),
    });
  }
  return points;
}

const claimedCompanies = companies.filter((c) => c.reivindicada);

export const companyAnalytics: CompanyAnalytics[] = claimedCompanies.map((c, i) => {
  const serie = buildSerie(i * 17 + 3);
  const sum = (key: keyof AnalyticsPoint) =>
    serie.reduce((acc, p) => acc + (p[key] as number), 0);
  return {
    companyId: c.id,
    visualizacoes: sum("visualizacoes"),
    cliquesWhatsapp: sum("cliquesWhatsapp"),
    leads: sum("leads"),
    cuponsUtilizados: sum("cuponsUtilizados"),
    avaliacao: c.avaliacaoMedia,
    serieDiaria: serie,
  };
});

export function getAnalyticsByCompany(companyId: string) {
  return companyAnalytics.find((a) => a.companyId === companyId);
}

const origens: LeadOrigem[] = ["whatsapp", "telefone", "cupom", "site"];
const tipos = ["Contato inicial", "Dúvida sobre serviço", "Pedido de orçamento", "Reserva", "Compra"];
const acoes = ["Clicou no WhatsApp", "Ligou para a empresa", "Resgatou cupom", "Acessou o site", "Enviou mensagem"];

export const leads: Lead[] = claimedCompanies.flatMap((c, ci) =>
  Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i * 2 + ci));
    return {
      id: `lead-${ci}-${i}`,
      companyId: c.id,
      data: d.toISOString(),
      origem: origens[(ci + i) % origens.length],
      tipo: tipos[(ci + i) % tipos.length],
      acao: acoes[(ci + i) % acoes.length],
    };
  })
);

export function getLeadsByCompany(companyId: string) {
  return leads.filter((l) => l.companyId === companyId);
}
