import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAuthToken } from "@/lib/auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/apiResponse";

// POST /api/auth/login
// Body: { email, senha }
// Retorna um token (JWT) que o cliente (site ou app) guarda e manda
// em todas as próximas chamadas como header "Authorization: Bearer <token>".
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body?.senha === "string" ? body.senha : "";

    if (!email || !senha) {
      return badRequest("Informe e-mail e senha.");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return unauthorized("E-mail ou senha incorretos.");
    }

    const senhaOk = await verifyPassword(senha, user.senhaHash);
    if (!senhaOk) {
      return unauthorized("E-mail ou senha incorretos.");
    }

    const token = signAuthToken({ sub: user.id, role: user.role, companyId: user.companyId });

    return ok({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return serverError();
  }
}
