import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";
import { slugify } from "@/lib/utils";

// Lista ampla de segmentos comuns em guias comerciais locais (Pará/Belém),
// baseada no conjunto de categorias que o usuário pediu pra cadastrar.
// upsert por slug — rodar de novo não duplica nem sobrescreve edições
// feitas depois pelo admin (update: {}).
const CATEGORIAS: { nome: string; icone: string }[] = [
  { nome: "Academias", icone: "🏋️" },
  { nome: "Açaí", icone: "🍇" },
  { nome: "Acessórios e Eletrônicos", icone: "🔌" },
  { nome: "Advocacia", icone: "⚖️" },
  { nome: "Água Mineral", icone: "💧" },
  { nome: "Ar Condicionado", icone: "❄️" },
  { nome: "Artigos Esportivos", icone: "⚽" },
  { nome: "Automóveis", icone: "🚗" },
  { nome: "Barbearias", icone: "💈" },
  { nome: "Bijuterias", icone: "💍" },
  { nome: "Bordados", icone: "🧵" },
  { nome: "Chaveiros", icone: "🔑" },
  { nome: "Clínica de Estética", icone: "💆" },
  { nome: "Comida Caseira", icone: "🍲" },
  { nome: "Comunicação Visual / Grafica", icone: "🖨️" },
  { nome: "Contadores", icone: "📊" },
  { nome: "Cosméticos", icone: "💄" },
  { nome: "Cuidadores", icone: "🤝" },
  { nome: "Depósito de Gás", icone: "🔥" },
  { nome: "Docerias", icone: "🍰" },
  { nome: "Educadores", icone: "📚" },
  { nome: "Eletricista", icone: "⚡" },
  { nome: "Encanador", icone: "🔧" },
  { nome: "Energia Sustentável", icone: "☀️" },
  { nome: "Enfermagem", icone: "💉" },
  { nome: "Escola de Dança", icone: "💃" },
  { nome: "Estamparias", icone: "👕" },
  { nome: "Financeiro", icone: "💰" },
  { nome: "Fisioterapeutas", icone: "🦵" },
  { nome: "Fretes", icone: "🚚" },
  { nome: "Grafite Artístico", icone: "🎨" },
  { nome: "Guinchos", icone: "🚛" },
  { nome: "Higienização de Estofados", icone: "🛋️" },
  { nome: "Hortifruti", icone: "🥬" },
  { nome: "Informática", icone: "💻" },
  { nome: "Jornal", icone: "📰" },
  { nome: "Lavanderias", icone: "🧺" },
  { nome: "Marcenaria", icone: "🪚" },
  { nome: "Marketing Digital", icone: "📱" },
  { nome: "Moda", icone: "👗" },
  { nome: "Organizadores", icone: "🗂️" },
  { nome: "Óticas", icone: "👓" },
  { nome: "Panificadoras", icone: "🍞" },
  { nome: "Personalizados", icone: "🎁" },
  { nome: "Pet Shop", icone: "🐶" },
  { nome: "Pizzarias", icone: "🍕" },
  { nome: "Produtora", icone: "🎬" },
  { nome: "Psicólogos", icone: "🧠" },
  { nome: "Relógios e Acessórios", icone: "⌚" },
  { nome: "Restaurantes e Churrasco", icone: "🍖" },
  { nome: "Salões de Beleza", icone: "💇" },
  { nome: "Sanduíches", icone: "🥪" },
  { nome: "Saúde", icone: "🩺" },
  { nome: "Sorveteria", icone: "🍦" },
  { nome: "Vidraçaria", icone: "🪟" },
];

// POST /api/admin/seed/categories — importa a lista padrão de categorias
// (não apaga nem duplica as que já existem).
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    let criadas = 0;
    for (const cat of CATEGORIAS) {
      const slug = slugify(cat.nome);
      if (!slug) continue;
      const existente = await prisma.category.findUnique({ where: { slug } });
      if (existente) continue;
      await prisma.category.create({ data: { slug, nome: cat.nome, icone: cat.icone, ativo: true } });
      criadas++;
    }

    return ok({ criadas, totalNaLista: CATEGORIAS.length });
  } catch (err) {
    console.error("[POST /api/admin/seed/categories]", err);
    return serverError();
  }
}
