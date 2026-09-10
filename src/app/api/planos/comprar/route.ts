import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok, serverError } from "@/lib/apiResponse";
import { mpConfigured } from "@/lib/mercadopago";

const PERIODOS = ["mensal", "trimestral", "anual"] as const;
type Periodo = (typeof PERIODOS)[number];

const CAMPO_PRECO: Record<Periodo, "precoMensal" | "precoTrimestral" | "precoAnual"> = {
  mensal: "precoMensal",
  trimestral: "precoTrimestral",
  anual: "precoAnual",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/planos/comprar — primeiro passo pra alguém contratar um plano
// direto pela página pública "Para empresas" (ainda sem ter conta nem
// empresa cadastrada no BuscaZapp). Só cria o registro `PlanPurchase`
// ("pendente") com o preço vindo do banco (nunca do navegador) — o
// pagamento em si acontece depois, sem sair da página, em
// POST /api/planos/[id]/pagar (mesmo Payment Brick do Impulsionar).
// Body: { planoId, periodicidade, nome, email, telefone? }
export async function POST(request: NextRequest) {
  try {
    if (!mpConfigured()) {
      return serverError(
        "Pagamento ainda não foi configurado neste projeto (falta a variável de ambiente MP_ACCESS_TOKEN)."
      );
    }

    const body = await request.json().catch(() => null);
    const planoId = typeof body?.planoId === "string" ? body.planoId : "";
    const periodicidade = typeof body?.periodicidade === "string" ? body.periodicidade : "";
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const telefone = typeof body?.telefone === "string" ? body.telefone.trim() : undefined;

    if (!nome) return badRequest("Informe seu nome.");
    if (!EMAIL_RE.test(email)) return badRequest("Informe um e-mail válido.");
    if (!(PERIODOS as readonly string[]).includes(periodicidade)) return badRequest("Periodicidade inválida.");

    const plano = await prisma.plan.findUnique({ where: { id: planoId } });
    if (!plano) return notFound("Plano não encontrado.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
    const valor = Number((plano as any)[CAMPO_PRECO[periodicidade as Periodo]]);
    if (!Number.isFinite(valor) || valor <= 0) {
      return badRequest("Esse plano é gratuito — não precisa de pagamento, é só criar a conta.");
    }

    const purchase = await prisma.planPurchase.create({
      data: {
        planoId,
        periodicidade,
        valor,
        nome,
        email,
        telefone,
        status: "pendente",
        cadastroToken: randomUUID(),
      },
    });

    return ok({ purchaseId: purchase.id, valor });
  } catch (err) {
    console.error("[POST /api/planos/comprar]", err);
    return serverError("Não foi possível iniciar a compra do plano. Tente novamente em instantes.");
  }
}
