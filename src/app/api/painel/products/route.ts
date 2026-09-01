import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, created, forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/products — produtos da empresa logada (ativos e inativos).
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const products = await prisma.product.findMany({
      where: { companyId: auth.companyId },
      orderBy: { createdAt: "desc" },
    });
    return ok(products);
  } catch (err) {
    console.error("[GET /api/painel/products]", err);
    return serverError();
  }
}

// POST /api/painel/products — cria um produto novo.
// Body: { nome, descricao, preco, precoPromocional?, imagemUrl?, ativo? }
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const body = await request.json().catch(() => null);
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const descricao = typeof body?.descricao === "string" ? body.descricao.trim() : "";
    const preco = Number(body?.preco);
    const precoPromocional =
      body?.precoPromocional !== undefined && body?.precoPromocional !== null && body?.precoPromocional !== ""
        ? Number(body.precoPromocional)
        : null;
    const imagemUrl = typeof body?.imagemUrl === "string" ? body.imagemUrl : null;
    const ativo = typeof body?.ativo === "boolean" ? body.ativo : true;

    if (!nome || !descricao || !Number.isFinite(preco)) {
      return badRequest("Informe nome, descrição e preço.");
    }

    const product = await prisma.product.create({
      data: { companyId: auth.companyId, nome, descricao, preco, precoPromocional, imagemUrl, ativo },
    });

    return created(product);
  } catch (err) {
    console.error("[POST /api/painel/products]", err);
    return serverError();
  }
}
