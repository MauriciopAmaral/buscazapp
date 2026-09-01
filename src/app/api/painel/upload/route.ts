import { NextRequest } from "next/server";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { uploadFileToHostinger, uploadsConfigured } from "@/lib/ftpUpload";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_SIZE = 4 * 1024 * 1024; // 4MB — dentro do limite de payload de function da Vercel

// POST /api/painel/upload — envia uma imagem (logo, capa, galeria, produto,
// serviço) pra pasta de uploads da Hostinger e devolve a URL pública.
// multipart/form-data: campos "file" (obrigatório) e "pasta" (opcional, ex: "logo", "galeria").
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUserWithRole(request, ["empresa"]);
    if (!auth) return unauthorized("Faça login como empresa.");
    if (!auth.companyId) return forbidden("Essa conta ainda não está vinculada a uma empresa.");

    if (!uploadsConfigured()) {
      return serverError(
        "Upload de imagens ainda não foi configurado neste projeto (faltam variáveis de ambiente FTP_*/UPLOADS_PUBLIC_URL)."
      );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    const pastaRaw = formData?.get("pasta");
    const pasta = typeof pastaRaw === "string" ? pastaRaw.replace(/[^a-z0-9-]/gi, "").slice(0, 30) : "geral";

    if (!(file instanceof File)) return badRequest("Envie um arquivo no campo 'file'.");

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) return badRequest("Formato inválido. Envie uma imagem JPG, PNG ou WEBP.");
    if (file.size > MAX_SIZE) return badRequest("Arquivo muito grande (máximo 4MB).");

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const remotePath = `empresas/${auth.companyId}/${pasta || "geral"}/${fileName}`;

    const url = await uploadFileToHostinger({ buffer, remotePath });

    return ok({ url });
  } catch (err) {
    console.error("[POST /api/painel/upload]", err);
    return serverError("Não foi possível enviar a imagem.");
  }
}
