// Camada de serviço — hoje consome os mocks locais.
// No futuro, cada função aqui passa a chamar a API real,
// sem que as telas precisem ser alteradas.

import {
  companies,
  getCompanyBySlug,
  getCompaniesByCategory,
  getCompaniesByCity,
} from "@/mocks/companies";
import { Company } from "@/types";

const DELAY = 0;

function resolveAfter<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY));
}

export interface SearchFilters {
  termo?: string;
  cidade?: string;
  bairro?: string;
  categoriaSlug?: string;
  avaliacaoMinima?: number;
  abertoAgora?: boolean;
  comOfertas?: boolean;
  comCupons?: boolean;
  ordenarPor?: "relevancia" | "proximas" | "avaliadas" | "destaque";
}

export const companyService = {
  async list(): Promise<Company[]> {
    return resolveAfter(companies);
  },

  async getBySlug(slug: string): Promise<Company | undefined> {
    return resolveAfter(getCompanyBySlug(slug));
  },

  async getByCategory(categoriaId: string): Promise<Company[]> {
    return resolveAfter(getCompaniesByCategory(categoriaId));
  },

  async getByCity(cidade: string): Promise<Company[]> {
    return resolveAfter(getCompaniesByCity(cidade));
  },

  async search(filters: SearchFilters): Promise<Company[]> {
    let result = [...companies];

    if (filters.termo) {
      const termo = filters.termo.toLowerCase();
      result = result.filter(
        (c) =>
          c.nomeFantasia.toLowerCase().includes(termo) ||
          c.categoriaNome.toLowerCase().includes(termo) ||
          c.descricao.toLowerCase().includes(termo)
      );
    }
    if (filters.cidade) {
      result = result.filter((c) => c.endereco.cidade === filters.cidade);
    }
    if (filters.bairro) {
      result = result.filter((c) => c.endereco.bairro === filters.bairro);
    }
    if (filters.categoriaSlug) {
      result = result.filter(
        (c) => c.categoriaNome.toLowerCase() === filters.categoriaSlug!.toLowerCase()
      );
    }
    if (filters.avaliacaoMinima) {
      result = result.filter((c) => c.avaliacaoMedia >= filters.avaliacaoMinima!);
    }

    switch (filters.ordenarPor) {
      case "avaliadas":
        result.sort((a, b) => b.avaliacaoMedia - a.avaliacaoMedia);
        break;
      case "destaque":
        result.sort((a, b) => Number(b.premium) - Number(a.premium));
        break;
      default:
        break;
    }

    // Patrocinados sempre primeiro
    result.sort((a, b) => Number(b.patrocinada) - Number(a.patrocinada));

    return resolveAfter(result);
  },

  async featured(): Promise<Company[]> {
    return resolveAfter(companies.filter((c) => c.premium).slice(0, 8));
  },

  async nearby(): Promise<Company[]> {
    return resolveAfter(companies.slice(0, 8));
  },
};
