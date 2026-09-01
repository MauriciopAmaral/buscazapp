import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/apiResponse";
import { companyListInclude, mapCompany } from "@/lib/companyData";

// GET /api/club/partners — empresas parceiras do BuscaZapp Clube.
export async function GET() {
  try {
    const partners = await prisma.company.findMany({
      where: { clubeParceiro: true, status: "ativo" },
      include: companyListInclude,
      orderBy: { avaliacaoMedia: "desc" },
    });

    // Formato completo (igual ao tipo `Company` do frontend) — o site usa
    // isso direto no CompanyCard, que também depende de `horarios` etc.
    return ok(partners.map((c) => mapCompany(c)));
  } catch (err) {
    console.error("[GET /api/club/partners]", err);
    return serverError();
  }
}
