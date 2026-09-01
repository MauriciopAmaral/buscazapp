import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { deleteFileFromHostinger, uploadsConfigured } from "@/lib/ftpUpload";

// DELETE /api/painel/gallery/[id] — remove uma imagem da galeria.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    const { id } = await params;
    const existing = await prisma.galleryImage.findUnique({ where: { id } });
    if (!existing || existing.companyId !== auth.companyId) return notFound("Imagem não encontrada.");

    await prisma.galleryImage.delete({ where: { id } });

    // Tenta apagar o arquivo físico também — se a URL aponta pra pasta de
    // uploads gerenciada por este app. Falha aqui não desfaz a exclusão no banco.
    try {
      if (uploadsConfigured()) {
        const publicBaseUrl = (process.env.UPLOADS_PUBLIC_URL ?? "").replace(/\/+$/, "");
        if (publicBaseUrl && existing.url.startsWith(publicBaseUrl)) {
          await deleteFileFromHostinger(existing.url.slice(publicBaseUrl.length).replace(/^\/+/, ""));
        }
      }
    } catch {
      // ignora — a exclusão no banco já valeu
    }

    return ok({ id });
  } catch (err) {
    console.error("[DELETE /api/painel/gallery/[id]]", err);
    return serverError();
  }
}
