import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/apiResponse";

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
