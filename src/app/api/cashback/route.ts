import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/cashback — saldo + extrato do usuário logado.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized();

    const transactions = await prisma.cashbackTransaction.findMany({
      where: { userId: auth.sub },
      include: { company: { select: { nomeFantasia: true } } },
      orderBy: { createdAt: "desc" },
    });

    const saldo = transactions
      .filter((t) => t.status === "creditado")
      .reduce((sum, t) => sum + Number(t.valorCashback), 0);

    return ok({
      saldo,
      extrato: transactions.map((t) => ({
        id: t.id,
        companyId: t.companyId,
        companyNome: t.company.nomeFantasia,
        data: t.createdAt,
        valorCompra: t.valorCompra,
        percentual: t.percentual,
        valorCashback: t.valorCashback,
        status: t.status,
      })),
    });
  } catch (err) {
    console.error("[GET /api/cashback]", err);
    return serverError();
  }
}
