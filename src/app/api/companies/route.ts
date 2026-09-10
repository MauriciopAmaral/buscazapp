import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/apiResponse";
import { companyListInclude, mapCompany } from "@/lib/companyData";
import { getActiveAdCompanyIdsByTipo } from "@/lib/adBoosts";

// GET /api/companies?q=&cidade=&categoria=&avaliacaoMinima=&ordenarPor=&page=&pageSize=
//
// Lista paginada de empresas, com os mesmos filtros que a tela de busca
// do site já usa (src/services/companyService.ts) — pra facilitar a
// migração desse service de mock pra API real.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const cidade = searchParams.get("cidade")?.trim();
    const categoriaSlug = searchParams.get("categoria")?.trim();
    const avaliacaoMinima = Number(searchParams.get("avaliacaoMinima") ?? 0) || 0;
    const ordenarPor = searchParams.get("ordenarPor") ?? "relevancia";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 9) || 9));

    const where: Prisma.CompanyWhereInput = {
      status: "ativo",
      ...(cidade ? { cidadeNome: cidade } : {}),
      ...(categoriaSlug ? { categoria: { slug: categoriaSlug } } : {}),
      ...(avaliacaoMinima ? { avaliacaoMedia: { gte: avaliacaoMinima } } : {}),
      ...(q
        ? {
            OR: [
              { nomeFantasia: { contains: q } },
              { descricao: { contains: q } },
              { categoria: { nome: { contains: q } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.CompanyOrderByWithRelationInput[] =
      ordenarPor === "avaliadas"
        ? [{ patrocinada: "desc" }, { avaliacaoMedia: "desc" }]
        : ordenarPor === "destaque"
          ? [{ patrocinada: "desc" }, { premium: "desc" }]
          : [{ patrocinada: "desc" }, { verificado: "desc" }];

    // Impulsionamentos pagos (Painel > Impulsionar) que valem pra essa busca:
    // "Resultado patrocinado" vale sempre; "Destaque na categoria"/"na
    // cidade" só quando a busca já está filtrada por aquela categoria/cidade
    // (o impulsionamento é da própria empresa, então só faz sentido destacar
    // ela dentro do recorte que ele prometeu).
    const impulsionadasPorTipo = await getActiveAdCompanyIdsByTipo([
      "resultado_patrocinado",
      ...(categoriaSlug ? (["destaque_categoria"] as const) : []),
      ...(cidade ? (["destaque_cidade"] as const) : []),
    ]);
    const boostIds = new Set([
      ...impulsionadasPorTipo.resultado_patrocinado,
      ...(impulsionadasPorTipo.destaque_categoria ?? []),
      ...(impulsionadasPorTipo.destaque_cidade ?? []),
    ]);

    // Busca só os IDs (sem skip/take) pra poder colocar os impulsionados na
    // frente e só DEPOIS paginar — senão uma empresa impulsionada que caísse
    // numa página 2 nunca apareceria na frente de ninguém.
    const todosIds = await prisma.company.findMany({ where, orderBy, select: { id: true } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, que este sandbox não consegue rodar (ver AGENTS.md / HOSTINGER_MYSQL_SETUP.md); na Vercel o build gera o client normalmente.
    const idsOrdenados = (todosIds as any[])
      .slice()
      .sort((a, b) => (boostIds.size === 0 ? 0 : Number(boostIds.has(b.id)) - Number(boostIds.has(a.id))))
      .map((c) => c.id as string);

    const total = idsOrdenados.length;
    const idsDaPagina = idsOrdenados.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

    const rows = await prisma.company.findMany({
      where: { id: { in: idsDaPagina } },
      include: companyListInclude,
    });
    // findMany com `id: { in }` não garante a ordem — reordena pra bater com idsDaPagina.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const porId = new Map((rows as any[]).map((c) => [c.id as string, c]));
    const companies = idsDaPagina.map((id) => porId.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));

    return ok({
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      // Formato completo (igual ao tipo `Company` do frontend) — assim o
      // mesmo endpoint serve tanto o app mobile quanto as telas do site que
      // já esperavam o objeto Company inteiro (ex: CompanyCard usa horarios).
      empresas: companies.map((c) => ({
        ...mapCompany(c),
        patrocinada: c.patrocinada || impulsionadasPorTipo.resultado_patrocinado.has(c.id),
      })),
    });
  } catch (err) {
    console.error("[GET /api/companies]", err);
    return serverError();
  }
}
