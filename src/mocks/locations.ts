import { City, Neighborhood } from "@/types";
import { companies, cidadesPara } from "./companies";

export const cities: City[] = cidadesPara.map((nome, i) => ({
  id: `city-${i + 1}`,
  nome,
  // Estado vem dos dados reais da empresa (nem toda cidade é do Pará —
  // ver src/mocks/legacyCompanies.ts), com "PA" como default só de segurança.
  estado: companies.find((c) => c.endereco.cidade === nome)?.endereco.estado ?? "PA",
  totalEmpresas: companies.filter((c) => c.endereco.cidade === nome).length,
}));

const bairrosPorCidade: Record<string, string[]> = {
  Belém: ["Nazaré", "Batista Campos", "Marco", "Umarizal", "Cidade Velha", "Pedreira", "Reduto", "Guamá", "Telégrafo"],
  Ananindeua: ["Coqueiro", "Icuí Guajará", "Águas Lindas", "Centro", "Aurá", "Curuçambá", "Cidade Nova", "Distrito Industrial"],
  Castanhal: ["Centro", "Jaderlândia", "São José"],
  Marituba: ["Centro", "Distrito Industrial"],
  Benevides: ["Centro"],
  // Cidades trazidas pela importação do banco antigo (1 bairro cada, o que
  // veio no dado original).
  "São Paulo": ["Moema"],
  "Rio de Janeiro": ["Copacabana"],
  "Belo Horizonte": ["Savassi"],
  Curitiba: ["Batel"],
  Brasília: ["Asa Sul"],
  Salvador: ["Pituba"],
};

export const neighborhoods: Neighborhood[] = Object.entries(bairrosPorCidade).flatMap(
  ([cidade, bairros], ci) => {
    const city = cities.find((c) => c.nome === cidade)!;
    return bairros.map((nome, i) => ({
      id: `neighborhood-${ci}-${i}`,
      nome,
      cidadeId: city.id,
    }));
  }
);
