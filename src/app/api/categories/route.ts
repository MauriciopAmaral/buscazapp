import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/apiResponse";

// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: { _count: { select: { companies: true } } },
    });

    return ok(
      categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        nome: c.nome,
        icone: c.icone,
        descricao: c.descricao,
        ativo: c.ativo,
        totalEmpresas: c._count.companies,
      }))
    );
  } catch (err) {
    console.error("[GET /api/categories]", err);
    return serverError();
  }
}
