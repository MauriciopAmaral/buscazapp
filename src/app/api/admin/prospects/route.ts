import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/prospects — todo o funil de prospecção, com os dados da
// empresa já embutidos (nome, cidade, telefone) pra montar o quadro Kanban.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Só administradores podem ver essa lista.");

    const rows = await prisma.prospect.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: { select: { nomeFantasia: true, cidadeNome: true, telefone: true, whatsapp: true } } },
    });

    return ok(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      rows.map((p: any) => ({
        id: p.id,
        companyId: p.companyId,
        companyNome: p.company.nomeFantasia,
        cidade: p.company.cidadeNome,
        telefone: p.company.whatsapp || p.company.telefone,
        status: p.status,
        ultimoContato: p.ultimoContato ? p.ultimoContato.toISOString() : undefined,
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/prospects]", err);
    return serverError();
  }
}

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

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { nomeFantasia: true, cidadeNome: true, telefone: true, whatsapp: true },
    });
    if (!company) return notFound("Empresa não encontrada.");

    const prospect = await prisma.prospect.upsert({
      where: { companyId },
      update: { ultimoContato: new Date() },
      create: { companyId, status: "novo" },
    });

    return ok({
      id: prospect.id,
      companyId: prospect.companyId,
      companyNome: company.nomeFantasia,
      cidade: company.cidadeNome,
      telefone: company.whatsapp || company.telefone,
      status: prospect.status,
      ultimoContato: prospect.ultimoContato ? prospect.ultimoContato.toISOString() : undefined,
    });
  } catch (err) {
    console.error("[POST /api/admin/prospects]", err);
    return serverError();
  }
}
