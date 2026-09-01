import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { badRequest, created, notFound, serverError, unauthorized } from "@/lib/apiResponse";

// POST /api/claims — Body: { companySlug, metodo: "email" | "telefone" | "documento" }
// Abre um pedido de reivindicação de perfil. Precisa de login (qualquer
// papel) — normalmente um usuário "empresa" recém-criado reivindicando
// o perfil que já existia sem dono.
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized("Faça login pra reivindicar um perfil.");

    const body = await request.json().catch(() => null);
    const companySlug = typeof body?.companySlug === "string" ? body.companySlug : "";
    const metodo = ["email", "telefone", "documento"].includes(body?.metodo) ? body.metodo : "email";
    if (!companySlug) return badRequest("Informe companySlug.");

    const company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) return notFound("Empresa não encontrada.");

    const claim = await prisma.claim.create({
      data: {
        companyId: company.id,
        userId: auth.sub,
        metodo,
        status: "novo",
      },
    });

    return created(claim);
  } catch (err) {
    console.error("[POST /api/claims]", err);
    return serverError();
  }
}
