import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { mpConfigured } from "@/lib/mercadopago";
import { aplicarTrocaGratuita } from "@/lib/subscriptionChangePayment";

const PERIODOS = ["mensal", "trimestral", "anual"] as const;
type Periodo = (typeof PERIODOS)[number];

const CAMPO_PRECO: Record<Periodo, "precoMensal" | "precoTrimestral" | "precoAnual"> = {
  mensal: "precoMensal",
  trimestral: "precoTrimestral",
  anual: "precoAnual",
};

// POST /api/painel/subscription/mudar — a empresa (já logada) escolhe um
// plano/periodicidade diferente do atual. Se o plano escolhido for
// gratuito (valor 0), aplica na hora, sem precisar pagar nada — devolve
// `{ status: "aplicado" }`. Se for pago, só cria o registro
// `SubscriptionChange` ("pendente") com o preço vindo do banco; o
// pagamento em si acontece depois, sem sair da página, em
// POST /api/painel/subscription/mudar/[id]/pagar (mesmo Payment Brick do
// Impulsionar/Planos).
// Body: { planoId, periodicidade }
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const body = await request.json().catch(() => null);
    const planoId = typeof body?.planoId === "string" ? body.planoId : "";
    const periodicidade = typeof body?.periodicidade === "string" ? body.periodicidade : "";

    if (!(PERIODOS as readonly string[]).includes(periodicidade)) return badRequest("Periodicidade inválida.");

    const plano = await prisma.plan.findUnique({ where: { id: planoId } });
    if (!plano) return notFound("Plano não encontrado.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
    const valor = Number((plano as any)[CAMPO_PRECO[periodicidade as Periodo]]);
    if (!Number.isFinite(valor) || valor < 0) return badRequest("Preço inválido pra esse plano.");

    if (valor === 0) {
      const change = await prisma.subscriptionChange.create({
        data: { companyId: auth.companyId, planoId, periodicidade, valor: 0, status: "pendente" },
      });
      await aplicarTrocaGratuita(change);
      return ok({ status: "aplicado" });
    }

    if (!mpConfigured()) {
      return serverError(
        "Pagamento ainda não foi configurado neste projeto (falta a variável de ambiente MP_ACCESS_TOKEN)."
      );
    }

    const change = await prisma.subscriptionChange.create({
      data: { companyId: auth.companyId, planoId, periodicidade, valor, status: "pendente" },
    });

    return ok({ changeId: change.id, valor });
  } catch (err) {
    console.error("[POST /api/painel/subscription/mudar]", err);
    return serverError("Não foi possível iniciar a troca de plano. Tente novamente em instantes.");
  }
}
