import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// DELETE /api/admin/locations/neighborhoods/[id] — remove um bairro
// cadastrado errado (não tem nada dependendo dele — Company usa `bairro`
// como texto livre, não referencia o Neighborhood).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const existente = await prisma.neighborhood.findUnique({ where: { id } });
    if (!existente) return notFound("Bairro não encontrado.");

    await prisma.neighborhood.delete({ where: { id } });
    return ok({ excluido: true });
  } catch (err) {
    console.error("[DELETE /api/admin/locations/neighborhoods/[id]]", err);
    return serverError();
  }
}
