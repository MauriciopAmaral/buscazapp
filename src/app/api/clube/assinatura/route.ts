import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/clube/assinatura — assinatura do Clube (se houver) e histórico
// de pagamentos do usuário logado. As linhas de `ClubPurchase` com status
// "pago" já servem de histórico — não precisa de tabela própria.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized("Faça login pra ver sua assinatura do Clube.");

    const [subscription, purchases] = await Promise.all([
      prisma.clubSubscription.findUnique({ where: { userId: auth.sub } }),
      prisma.clubPurchase.findMany({ where: { userId: auth.sub, status: "pago" }, orderBy: { createdAt: "desc" } }),
    ]);

    return ok({
      subscription: subscription
        ? {
            status: subscription.status,
            valor: Number(subscription.valor),
            proximaCobranca: subscription.proximaCobranca.toISOString(),
          }
        : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
      pagamentos: (purchases as any[]).map((p) => ({
        id: p.id,
        data: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
        valor: Number(p.valor),
      })),
    });
  } catch (err) {
    console.error("[GET /api/clube/assinatura]", err);
    return serverError();
  }
}
