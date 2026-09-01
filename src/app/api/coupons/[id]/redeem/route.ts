import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { badRequest, notFound, ok, serverError } from "@/lib/apiResponse";

// POST /api/coupons/[id]/redeem
// Marca 1 uso do cupom e devolve o código. Também gera um Lead (origem
// "cupom") pra aparecer nas estatísticas do painel da empresa.
// Aceita usuário anônimo (mesmo comportamento de hoje no protótipo) —
// se vier token, associa o resgate ao usuário nos logs.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = getAuthUser(request);

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) return notFound("Cupom não encontrado.");
    if (coupon.status !== "ativo") return badRequest("Esse cupom não está mais disponível.");
    if (coupon.limite > 0 && coupon.utilizados >= coupon.limite) {
      return badRequest("Esse cupom já atingiu o limite de usos.");
    }

    const [updated] = await prisma.$transaction([
      prisma.coupon.update({
        where: { id },
        data: { utilizados: { increment: 1 } },
      }),
      prisma.lead.create({
        data: {
          companyId: coupon.companyId,
          origem: "cupom",
          tipo: "cupom_resgatado",
          acao: auth ? `Resgatado por usuário ${auth.sub}` : "Resgatado por visitante",
        },
      }),
    ]);

    return ok({ codigo: updated.codigo, utilizados: updated.utilizados });
  } catch (err) {
    console.error("[POST /api/coupons/[id]/redeem]", err);
    return serverError();
  }
}
