// ============================================================
// BuscaZapp — efeito real dos impulsionamentos pagos (Painel > Impulsionar)
// nas páginas públicas do site.
//
// Pagar um impulsionamento cria uma linha em `Ad` (companyId, tipo,
// início/término, status "ativo") — ver src/lib/boostPayment.ts. Essas
// funções leem essa tabela pra saber quais empresas têm um impulsionamento
// pago e dentro do prazo ATUALMENTE, e são usadas pelas listagens públicas
// (home, categoria, busca, ofertas) pra colocar essas empresas na frente.
// ============================================================

import { prisma } from "@/lib/prisma";

export type AdTipo =
  | "destaque_home"
  | "destaque_categoria"
  | "destaque_cidade"
  | "resultado_patrocinado"
  | "promocao_destacada";

/** IDs de empresas com um impulsionamento pago e ativo (dentro do prazo) de um tipo específico, agora. */
export async function getActiveAdCompanyIds(tipo: AdTipo): Promise<Set<string>> {
  const agora = new Date();
  const rows = await prisma.ad.findMany({
    where: { tipo, status: "ativo", inicio: { lte: agora }, termino: { gte: agora } },
    select: { companyId: true },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, que este sandbox não consegue rodar (ver AGENTS.md / HOSTINGER_MYSQL_SETUP.md); na Vercel o build gera o client normalmente.
  return new Set((rows as any[]).map((r) => r.companyId as string));
}

/** Vários tipos de uma vez (uma consulta só), pra páginas que combinam mais de um. */
export async function getActiveAdCompanyIdsByTipo(tipos: AdTipo[]): Promise<Record<AdTipo, Set<string>>> {
  const agora = new Date();
  const rows = await prisma.ad.findMany({
    where: { tipo: { in: tipos }, status: "ativo", inicio: { lte: agora }, termino: { gte: agora } },
    select: { companyId: true, tipo: true },
  });
  const mapa = Object.fromEntries(tipos.map((t) => [t, new Set<string>()])) as Record<AdTipo, Set<string>>;
  for (const r of rows) mapa[r.tipo as AdTipo]?.add(r.companyId);
  return mapa;
}
