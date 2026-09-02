import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/locations/cities?estado=&q=&page=&pageSize= — lista
// paginada de cidades (pode ter milhares de linhas depois da importação
// do IBGE, então nunca devolve tudo de uma vez).
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado")?.trim().toUpperCase();
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? 50) || 50));

    const where = {
      ...(estado ? { estado } : {}),
      ...(q ? { nome: { contains: q } } : {}),
    };

    const [total, cidades] = await Promise.all([
      prisma.city.count({ where }),
      prisma.city.findMany({
        where,
        orderBy: [{ estado: "asc" }, { nome: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { neighborhoods: true, companies: true } } },
      }),
    ]);

    return ok({
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      cidades: cidades.map((c) => ({
        id: c.id,
        nome: c.nome,
        estado: c.estado,
        totalBairros: c._count.neighborhoods,
        totalEmpresas: c._count.companies,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/locations/cities]", err);
    return serverError();
  }
}
