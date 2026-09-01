import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// PATCH /api/admin/claims/[id] — Body: { status: "aprovado" | "rejeitado" | "em_analise" | "aguardando_validacao" }
// Aprovar uma reivindicação: marca a empresa como reivindicada e vincula o
// usuário que pediu (claim.userId) como dono dela (User.companyId).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem alterar reivindicações.");

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const status = body?.status;
    const statusValidos = ["novo", "aguardando_validacao", "em_analise", "aprovado", "rejeitado"];
    if (!statusValidos.includes(status)) return badRequest("Status inválido.");

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) return notFound("Reivindicação não encontrada.");

    await prisma.claim.update({ where: { id }, data: { status } });

    if (status === "aprovado") {
      await prisma.company.update({ where: { id: claim.companyId }, data: { reivindicada: true } });
      if (claim.userId) {
        await prisma.user.update({ where: { id: claim.userId }, data: { companyId: claim.companyId } });
      }
    }

    return ok({ id, status });
  } catch (err) {
    console.error("[PATCH /api/admin/claims/[id]]", err);
    return serverError();
  }
}
