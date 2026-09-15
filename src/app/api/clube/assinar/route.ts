import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { serverError, unauthorized, ok } from "@/lib/apiResponse";
import { mpConfigured } from "@/lib/mercadopago";
import { getOrCreateSettings } from "@/lib/settings";

// POST /api/clube/assinar — o usuário logado (consumidor, mas qualquer
// papel pode assinar) pede pra assinar (ou renovar) o BuscaZapp Clube. Só
// cria o registro `ClubPurchase` ("pendente") com o preço vindo do banco
// (Admin → Configurações); o pagamento em si acontece depois, sem sair da
// página, em POST /api/clube/assinar/[id]/pagar — mesmo Payment Brick já
// usado no Impulsionar/Planos/Assinatura de empresa.
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized("Faça login pra assinar o Clube.");

    if (!mpConfigured()) {
      return serverError(
        "Pagamento ainda não foi configurado neste projeto (falta a variável de ambiente MP_ACCESS_TOKEN)."
      );
    }

    const settings = await getOrCreateSettings();
    const valor = Number(settings.clubeValorMensal);

    const purchase = await prisma.clubPurchase.create({
      data: { userId: auth.sub, valor, status: "pendente" },
    });

    return ok({ purchaseId: purchase.id, valor });
  } catch (err) {
    console.error("[POST /api/clube/assinar]", err);
    return serverError("Não foi possível iniciar a assinatura do Clube. Tente novamente em instantes.");
  }
}
