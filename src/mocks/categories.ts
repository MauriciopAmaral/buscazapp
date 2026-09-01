import { Category } from "@/types";

export const categories: Category[] = [
  { id: "cat-1", slug: "restaurantes", nome: "Restaurantes", icone: "utensils", ativo: true, totalEmpresas: 7 },
  { id: "cat-2", slug: "pizzarias", nome: "Pizzarias", icone: "pizza", ativo: true, totalEmpresas: 3 },
  { id: "cat-3", slug: "eletricistas", nome: "Eletricistas", icone: "zap", ativo: true, totalEmpresas: 2 },
  { id: "cat-4", slug: "academias", nome: "Academias", icone: "dumbbell", ativo: true, totalEmpresas: 2 },
  { id: "cat-5", slug: "barbearias", nome: "Barbearias", icone: "scissors", ativo: true, totalEmpresas: 2 },
  { id: "cat-6", slug: "oficinas", nome: "Oficinas Mecânicas", icone: "wrench", ativo: true, totalEmpresas: 3 },
  { id: "cat-7", slug: "clinicas", nome: "Clínicas", icone: "stethoscope", ativo: true, totalEmpresas: 3 },
  { id: "cat-8", slug: "mercados", nome: "Mercados", icone: "shopping-cart", ativo: true, totalEmpresas: 2 },
  { id: "cat-9", slug: "salao-de-beleza", nome: "Salão de Beleza", icone: "sparkles", ativo: true, totalEmpresas: 3 },
  { id: "cat-10", slug: "pet-shops", nome: "Pet Shops", icone: "paw-print", ativo: true, totalEmpresas: 1 },
  { id: "cat-11", slug: "moveis-e-decoracao", nome: "Móveis e Decoração", icone: "sofa", ativo: true, totalEmpresas: 1 },
  { id: "cat-12", slug: "moda-e-vestuario", nome: "Moda e Vestuário", icone: "shirt", ativo: true, totalEmpresas: 1 },
  { id: "cat-13", slug: "advocacia", nome: "Advocacia", icone: "scale", ativo: true, totalEmpresas: 1 },
  { id: "cat-14", slug: "informatica", nome: "Informática e Celulares", icone: "smartphone", ativo: true, totalEmpresas: 2 },
  { id: "cat-15", slug: "construcao-e-reforma", nome: "Construção e Reforma", icone: "hammer", ativo: true, totalEmpresas: 2 },
];

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}
