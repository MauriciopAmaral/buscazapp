import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, created, forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/services — serviços da empresa logada.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const services = await prisma.service.findMany({
      where: { companyId: auth.companyId },
      orderBy: { createdAt: "desc" },
    });
    return ok(services);
  } catch (err) {
    console.error("[GET /api/painel/services]", err);
    return serverError();
  }
}

// POST /api/painel/services — cria um serviço novo.
// Body: { nome, descricao, precoInicial, imagemUrl? }
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const body = await request.json().catch(() => null);
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const descricao = typeof body?.descricao === "string" ? body.descricao.trim() : "";
    const precoInicial = Number(body?.precoInicial);
    const imagemUrl = typeof body?.imagemUrl === "string" ? body.imagemUrl : null;

    if (!nome || !descricao || !Number.isFinite(precoInicial)) {
      return badRequest("Informe nome, descrição e preço inicial.");
    }

    const service = await prisma.service.create({
      data: { companyId: auth.companyId, nome, descricao, precoInicial, imagemUrl },
    });

    return created(service);
  } catch (err) {
    console.error("[POST /api/painel/services]", err);
    return serverError();
  }
}
