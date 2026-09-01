import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/auth/me
// Retorna os dados do usuário dono do token enviado no header Authorization.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized();

    const user = await prisma.user.findUnique({ where: { id: auth.sub } });
    if (!user) return notFound("Usuário não encontrado.");

    return ok({
      id: user.id,
      nome: user.nome,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      companyId: user.companyId,
      clubeAssinante: user.clubeAssinante,
    });
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return serverError();
  }
}
