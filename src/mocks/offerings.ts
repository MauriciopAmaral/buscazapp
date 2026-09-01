import { Product, Service } from "@/types";
import { companies } from "./companies";

const claimedCompanies = companies.filter((c) => c.reivindicada).slice(0, 10);

const productNames = [
  "Combo Família", "Prato do Dia", "Kit Iniciante", "Pacote Mensal",
  "Item Premium", "Produto Best-seller", "Edição Especial", "Kit Completo",
];

export const products: Product[] = claimedCompanies.flatMap((c, ci) =>
  Array.from({ length: 3 }).map((_, i) => {
    const preco = 39.9 + ci * 3 + i * 7;
    return {
      id: `product-${ci}-${i}`,
      companyId: c.id,
      imagemUrl: `https://picsum.photos/seed/product-${ci}-${i}/400/300`,
      nome: `${productNames[(ci + i) % productNames.length]}`,
      descricao: "Descrição detalhada do item, com ingredientes ou especificações de qualidade.",
      preco,
      precoPromocional: i === 0 ? Math.round(preco * 0.85 * 100) / 100 : undefined,
      ativo: i !== 2 || ci % 2 === 0,
    };
  })
);

const serviceNames = [
  "Atendimento Básico", "Serviço Expresso", "Pacote Completo", "Consultoria",
  "Manutenção", "Instalação", "Avaliação Gratuita",
];

export const services: Service[] = claimedCompanies.flatMap((c, ci) =>
  Array.from({ length: 2 }).map((_, i) => ({
    id: `service-${ci}-${i}`,
    companyId: c.id,
    nome: serviceNames[(ci + i) % serviceNames.length],
    descricao: "Serviço prestado por profissionais qualificados, com garantia de satisfação.",
    precoInicial: 45 + ci * 5 + i * 10,
    imagemUrl: `https://picsum.photos/seed/service-${ci}-${i}/400/300`,
  }))
);

export function getProductsByCompany(companyId: string) {
  return products.filter((p) => p.companyId === companyId);
}

export function getServicesByCompany(companyId: string) {
  return services.filter((s) => s.companyId === companyId);
}
