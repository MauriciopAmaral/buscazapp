// Mesma ideia de src/lib/companyData.ts: leitura direta no Prisma pro lado
// do servidor (Server Components), devolvendo o mesmo formato que os mocks
// já usavam.

import { prisma } from "@/lib/prisma";
import type { Category } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ver nota em companyData.ts sobre os tipos do Prisma
function mapCategory(c: any, totalEmpresas: number): Category {
  return {
    id: c.id,
    slug: c.slug,
    nome: c.nome,
    icone: c.icone,
    descricao: c.descricao ?? undefined,
    categoriaPaiId: c.categoriaPaiId ?? undefined,
    ativo: c.ativo,
    totalEmpresas,
  };
}

export async function getCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    include: { _count: { select: { companies: { where: { status: "ativo" } } } } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((c: any) => mapCategory(c, c._count.companies));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const c = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { companies: { where: { status: "ativo" } } } } },
  });
  if (!c) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mapCategory(c, (c as any)._count.companies);
}
