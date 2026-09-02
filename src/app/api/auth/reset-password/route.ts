import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashResetToken } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/apiResponse";

// POST /api/auth/reset-password
// Body: { token, novaSenha }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const novaSenha = typeof body?.novaSenha === "string" ? body.novaSenha : "";

    if (!token) return badRequest("Link inválido.");
    if (novaSenha.length < 6) return badRequest("A senha precisa ter pelo menos 6 caracteres.");

    const tokenHash = hashResetToken(token);
    const registro = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!registro || registro.usedAt || registro.expiresAt < new Date()) {
      return badRequest("Esse link é inválido ou já expirou — peça um novo em 'Esqueci minha senha'.");
    }

    const senhaHash = await hashPassword(novaSenha);
    await prisma.$transaction([
      prisma.user.update({ where: { id: registro.userId }, data: { senhaHash } }),
      prisma.passwordResetToken.update({ where: { id: registro.id }, data: { usedAt: new Date() } }),
    ]);

    return ok({ message: "Senha atualizada com sucesso." });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return serverError();
  }
}
