import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, created, forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";

// GET /api/painel/gallery — lista as imagens da galeria da empresa logada (com id, pra poder excluir).
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const images = await prisma.galleryImage.findMany({
      where: { companyId: auth.companyId },
      orderBy: { ordem: "asc" },
    });
    return ok(images);
  } catch (err) {
    console.error("[GET /api/painel/gallery]", err);
    return serverError();
  }
}

// POST /api/painel/gallery — adiciona uma imagem à galeria da empresa logada.
// Body: { url } (a URL já deve ter vindo de POST /api/painel/upload)
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const body = await request.json().catch(() => null);
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) return badRequest("Informe a URL da imagem.");

    const ultima = await prisma.galleryImage.findFirst({
      where: { companyId: auth.companyId },
      orderBy: { ordem: "desc" },
    });

    const image = await prisma.galleryImage.create({
      data: { companyId: auth.companyId, url, ordem: (ultima?.ordem ?? -1) + 1 },
    });

    return created(image);
  } catch (err) {
    console.error("[POST /api/painel/gallery]", err);
    return serverError();
  }
}
