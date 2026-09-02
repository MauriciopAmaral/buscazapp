import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/apiResponse";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

// POST /api/auth/forgot-password
// Body: { email }
//
// Gera um link de redefinição de senha válido por 1 hora. Como ainda não
// existe um serviço de e-mail configurado no projeto (precisa de uma conta
// em algo como Resend/SendGrid + chave de API — mesma situação do código
// de verificação em /reivindicar), o link é devolvido direto na resposta em
// vez de ser enviado por e-mail. Assim que um serviço de e-mail for
// configurado, troque o retorno de "resetUrl" aqui por um envio de e-mail
// de verdade e pare de devolver o link na resposta.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) return badRequest("Informe o e-mail da conta.");

    const user = await prisma.user.findUnique({ where: { email } });

    // Não revela se o e-mail existe ou não na mensagem — só no campo
    // "resetToken" (presente só quando existe conta), pra evitar que
    // alguém descubra quais e-mails têm conta testando aqui.
    if (!user) {
      return ok({ message: "Se esse e-mail tiver uma conta, o link de redefinição aparece abaixo.", resetToken: null });
    }

    // Invalida qualquer link anterior ainda não usado, pra só o mais
    // recente funcionar.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const { token, tokenHash } = generatePasswordResetToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    });

    return ok({
      message: "Link de redefinição gerado — válido por 1 hora.",
      resetToken: token,
    });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return serverError();
  }
}
