import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/boosts/[id] — status de um impulsionamento específico.
// Usado pela página de retorno do pagamento (Painel → Impulsionar →
// retorno) pra saber se o webhook do Mercado Pago já confirmou ou não.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    const boost = await prisma.boost.findUnique({ where: { id }, include: { ad: true } });
    if (!boost || boost.companyId !== auth.companyId) return notFound("Impulsionamento não encontrado.");

    return ok(boost);
  } catch (err) {
    console.error("[GET /api/painel/boosts/[id]]", err);
    return serverError();
  }
}
