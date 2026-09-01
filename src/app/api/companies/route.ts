import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/apiResponse";
import { companyListInclude, mapCompany } from "@/lib/companyData";

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

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: companyListInclude,
      }),
    ]);

    return ok({
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      // Formato completo (igual ao tipo `Company` do frontend) — assim o
      // mesmo endpoint serve tanto o app mobile quanto as telas do site que
      // já esperavam o objeto Company inteiro (ex: CompanyCard usa horarios).
      empresas: companies.map((c) => mapCompany(c)),
    });
  } catch (err) {
    console.error("[GET /api/companies]", err);
    return serverError();
  }
}
