import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/leads — leads (contatos gerados) da empresa logada.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const leads = await prisma.lead.findMany({
      where: { companyId: auth.companyId },
      orderBy: { createdAt: "desc" },
    });
    return ok(leads.map((l) => ({ id: l.id, companyId: l.companyId, data: l.createdAt, origem: l.origem, tipo: l.tipo, acao: l.acao })));
  } catch (err) {
    console.error("[GET /api/painel/leads]", err);
    return serverError();
  }
}
