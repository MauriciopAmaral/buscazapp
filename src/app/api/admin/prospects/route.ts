import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// POST /api/admin/prospects — coloca uma empresa (ainda não reivindicada,
// tipicamente) no funil de prospecção. Idempotente: se já existir um
// Prospect pra essa empresa, só atualiza `ultimoContato` sem voltar o
// status pra trás (ex: não desfaz um "interessado" pra "novo").
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem fazer isso.");

    const body = await request.json().catch(() => null);
    const companyId = typeof body?.companyId === "string" ? body.companyId : "";
    if (!companyId) return badRequest("Informe a empresa (companyId).");

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return notFound("Empresa não encontrada.");

    const prospect = await prisma.prospect.upsert({
      where: { companyId },
      update: { ultimoContato: new Date() },
      create: { companyId, status: "novo" },
    });

    return ok(prospect);
  } catch (err) {
    console.error("[POST /api/admin/prospects]", err);
    return serverError();
  }
}
