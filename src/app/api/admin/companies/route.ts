import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";
import { companyListInclude, mapCompany } from "@/lib/companyData";

// GET /api/admin/companies — todas as empresas (qualquer status), pro painel de admin.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem ver essa lista.");

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: companyListInclude,
    });

    return ok(companies.map((c) => mapCompany(c)));
  } catch (err) {
    console.error("[GET /api/admin/companies]", err);
    return serverError();
  }
}
