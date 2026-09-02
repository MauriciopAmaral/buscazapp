import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, conflict, created, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/locations/neighborhoods?cidadeId= — bairros de uma cidade.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const cidadeId = new URL(request.url).searchParams.get("cidadeId")?.trim();
    if (!cidadeId) return badRequest("Informe ?cidadeId=");

    const bairros = await prisma.neighborhood.findMany({
      where: { cidadeId },
      orderBy: { nome: "asc" },
    });

    return ok(bairros.map((b) => ({ id: b.id, nome: b.nome, cidadeId: b.cidadeId })));
  } catch (err) {
    console.error("[GET /api/admin/locations/neighborhoods]", err);
    return serverError();
  }
}

// POST /api/admin/locations/neighborhoods — cadastra um bairro novo pra
// uma cidade. Body: { cidadeId, nome }
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const body = await request.json().catch(() => null);
    const cidadeId = typeof body?.cidadeId === "string" ? body.cidadeId.trim() : "";
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    if (!cidadeId) return badRequest("Informe a cidade.");
    if (!nome) return badRequest("Informe o nome do bairro.");

    const cidade = await prisma.city.findUnique({ where: { id: cidadeId } });
    if (!cidade) return notFound("Cidade não encontrada.");

    const existente = await prisma.neighborhood.findFirst({ where: { cidadeId, nome } });
    if (existente) return conflict("Esse bairro já está cadastrado nessa cidade.");

    const bairro = await prisma.neighborhood.create({ data: { cidadeId, nome } });
    return created({ id: bairro.id, nome: bairro.nome, cidadeId: bairro.cidadeId });
  } catch (err) {
    console.error("[POST /api/admin/locations/neighborhoods]", err);
    return serverError();
  }
}
