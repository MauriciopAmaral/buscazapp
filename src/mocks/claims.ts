import { Claim, ClaimStatus, Prospect, ProspectStatus, Ad } from "@/types";
import { companies } from "./companies";

const claimStatuses: ClaimStatus[] = ["novo", "aguardando_validacao", "em_analise", "aprovado", "rejeitado"];
const claimedCompanies = companies.filter((c) => c.reivindicada).slice(0, 12);
const claimUsers = ["Marcos Titan", "Beatriz Reis", "Eduardo Nunes", "Simone Alves", "Rogério Dias", "Patrícia Melo"];

export const claims: Claim[] = claimedCompanies.map((c, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i * 4);
  return {
    id: `claim-${i + 1}`,
    companyId: c.id,
    companyNome: c.nomeFantasia,
    usuario: claimUsers[i % claimUsers.length],
    metodo: (["email", "telefone", "documento"] as const)[i % 3],
    data: d.toISOString(),
    status: claimStatuses[i % claimStatuses.length],
  };
});

const prospectStatuses: ProspectStatus[] = [
  "novo", "contatado", "interessado", "reivindicado", "assinante", "nao_interessado",
];
const unclaimedCompanies = companies.filter((c) => !c.reivindicada);
const someClaimedForProspect = companies.filter((c) => c.reivindicada).slice(12, 20);
const prospectPool = [...unclaimedCompanies, ...someClaimedForProspect];

export const prospects: Prospect[] = prospectPool.map((c, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i * 2);
  return {
    id: `prospect-${i + 1}`,
    companyId: c.id,
    companyNome: c.nomeFantasia,
    cidade: c.endereco.cidade,
    telefone: c.telefone,
    status: prospectStatuses[i % prospectStatuses.length],
    ultimoContato: i % 6 === 0 ? undefined : d.toISOString(),
  };
});

const adTypes: Ad["tipo"][] = [
  "destaque_home", "destaque_categoria", "destaque_cidade", "resultado_patrocinado", "promocao_destacada",
];
const premiumCompanies = companies.filter((c) => c.premium);

export const ads: Ad[] = premiumCompanies.map((c, i) => {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 10);
  const termino = new Date();
  termino.setDate(termino.getDate() + 20);
  return {
    id: `ad-${i + 1}`,
    tipo: adTypes[i % adTypes.length],
    companyId: c.id,
    companyNome: c.nomeFantasia,
    cidade: c.endereco.cidade,
    inicio: inicio.toISOString(),
    termino: termino.toISOString(),
    status: i % 5 === 0 ? "pausado" : "ativo",
    cliques: Math.round(80 + i * 23.5),
    impressoes: Math.round(2000 + i * 340),
  };
});
