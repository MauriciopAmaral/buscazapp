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
    return serverError(`Não foi possível enviar a imagem. ${describeFtpError(err)}`);
  }
}

// Traduz o erro cru do FTP (basic-ftp) numa mensagem que dá pra agir —
// sem isso, todo problema de FTP (senha errada, host errado, pasta sem
// permissão, timeout) chegava pro usuário como a mesma frase genérica.
function describeFtpError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (lower.includes("altnames") || lower.includes("certificate")) return "O certificado TLS do servidor FTP não bate com o host usado na conexão (comum ao conectar por IP) — ajuste FTP_TLS_REJECT_UNAUTHORIZED ou use o hostname do servidor em vez do IP.";
  if (lower.includes("530")) return "Usuário ou senha FTP incorretos (verifique FTP_USER/FTP_PASSWORD).";
  if (lower.includes("timeout")) return "Não conseguiu conectar no servidor FTP (tempo esgotado) — verifique FTP_HOST/FTP_PORT e se o firewall da hospedagem permite conexões externas.";
  if (lower.includes("econnrefused")) return "Conexão recusada pelo servidor FTP — verifique FTP_HOST e FTP_PORT.";
  if (lower.includes("enotfound") || lower.includes("getaddrinfo")) return "Endereço do servidor FTP não encontrado — verifique FTP_HOST.";
  if (lower.includes("550") || lower.includes("permission") || lower.includes("553")) return "Sem permissão pra criar/gravar na pasta configurada — verifique FTP_BASE_PATH e as permissões da conta FTP.";
  if (lower.includes("não está configurado") || lower.includes("nao esta configurado")) return message;

  return `Detalhe técnico: ${message}`;
}
