import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// POST /api/clube/assinatura/cancelar — cancela a assinatura do Clube do
// usuário logado. Não estorna o período já pago (a pessoa mantém acesso
// até `proximaCobranca`, igual a qualquer assinatura por período fechado)
// — só marca como "cancelada" pra não gerar mais lembrete de cobrança, e
// já tira `clubeAssinante` na hora pra simplificar (evita ter que checar
// data em todo lugar que usa esse campo).
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized("Faça login pra gerenciar sua assinatura.");

    const subscription = await prisma.clubSubscription.findUnique({ where: { userId: auth.sub } });
    if (!subscription) return notFound("Você não tem uma assinatura do Clube.");

    await prisma.$transaction([
      prisma.clubSubscription.update({ where: { userId: auth.sub }, data: { status: "cancelada" } }),
      prisma.user.update({ where: { id: auth.sub }, data: { clubeAssinante: false } }),
    ]);

    return ok({ status: "cancelada" });
  } catch (err) {
    console.error("[POST /api/clube/assinatura/cancelar]", err);
    return serverError();
  }
}
