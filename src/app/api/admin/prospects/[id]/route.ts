import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

const STATUS_VALIDOS = ["novo", "contatado", "interessado", "reivindicado", "assinante", "nao_interessado"] as const;

// PATCH /api/admin/prospects/[id] — move um card entre as colunas do
// quadro (ex: "Avançar etapa"), ou muda direto pra qualquer status. Também
// atualiza `ultimoContato`.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem fazer isso.");

    const { id } = await params;
    const existente = await prisma.prospect.findUnique({ where: { id } });
    if (!existente) return notFound("Prospecção não encontrada.");

    const body = await request.json().catch(() => null);
    if (typeof body?.status !== "string" || !STATUS_VALIDOS.includes(body.status as (typeof STATUS_VALIDOS)[number])) {
      return badRequest("Status inválido.");
    }

    const prospect = await prisma.prospect.update({
      where: { id },
      data: { status: body.status, ultimoContato: new Date() },
      include: { company: { select: { nomeFantasia: true, cidadeNome: true, telefone: true, whatsapp: true } } },
    });

    return ok({
      id: prospect.id,
      companyId: prospect.companyId,
      companyNome: prospect.company.nomeFantasia,
      cidade: prospect.company.cidadeNome,
      telefone: prospect.company.whatsapp || prospect.company.telefone,
      status: prospect.status,
      ultimoContato: prospect.ultimoContato ? prospect.ultimoContato.toISOString() : undefined,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/prospects/[id]]", err);
    return serverError();
  }
}

// DELETE /api/admin/prospects/[id] — tira a empresa do funil de prospecção
// (não mexe na empresa em si, só no card do quadro).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem fazer isso.");

    const { id } = await params;
    const existente = await prisma.prospect.findUnique({ where: { id } });
    if (!existente) return notFound("Prospecção não encontrada.");

    await prisma.prospect.delete({ where: { id } });
    return ok({ excluido: true });
  } catch (err) {
    console.error("[DELETE /api/admin/prospects/[id]]", err);
    return serverError();
  }
}
