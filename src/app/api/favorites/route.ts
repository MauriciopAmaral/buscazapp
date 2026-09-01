import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { badRequest, created, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/favorites — lista as empresas favoritadas pelo usuário logado.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized();

    const favorites = await prisma.favorite.findMany({
      where: { userId: auth.sub },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });

    return ok(favorites.map((f) => f.company));
  } catch (err) {
    console.error("[GET /api/favorites]", err);
    return serverError();
  }
}

// POST /api/favorites — Body: { companyId }
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return unauthorized();

    const body = await request.json().catch(() => null);
    const companyId = typeof body?.companyId === "string" ? body.companyId : "";
    if (!companyId) return badRequest("Informe companyId.");

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return notFound("Empresa não encontrada.");

    const favorite = await prisma.favorite.upsert({
      where: { userId_companyId: { userId: auth.sub, companyId } },
      update: {},
      create: { userId: auth.sub, companyId },
    });

    return created(favorite);
  } catch (err) {
    console.error("[POST /api/favorites]", err);
    return serverError();
  }
}
