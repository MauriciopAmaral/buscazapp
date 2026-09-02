import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/admin/locations/states — estados com cidades cadastradas (e
// quantas), agrupado direto no banco (evita baixar todas as cidades só
// pra contar).
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const grupos = await prisma.city.groupBy({
      by: ["estado"],
      _count: { _all: true },
      orderBy: { estado: "asc" },
    });

    return ok(grupos.map((g) => ({ sigla: g.estado, totalCidades: g._count._all })));
  } catch (err) {
    console.error("[GET /api/admin/locations/states]", err);
    return serverError();
  }
}
