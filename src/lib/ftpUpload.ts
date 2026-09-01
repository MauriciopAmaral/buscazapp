// Envio de imagens (logo, capa, galeria, fotos de produto) pra uma pasta
// dentro da própria hospedagem Hostinger, via FTP — em vez de um serviço de
// storage separado (Cloudflare R2, S3 etc). A Vercel (onde o Next.js roda)
// não guarda arquivos enviados de forma permanente, então o app se conecta
// na Hostinger por FTP a cada upload, salva o arquivo lá dentro de
// public_html/uploads/... e guarda no banco só a URL pública resultante.
//
// Requer 4 variáveis de ambiente (ver .env.example e HOSTINGER_MYSQL_SETUP.md):
//   FTP_HOST, FTP_USER, FTP_PASSWORD — dados de acesso FTP do hPanel da Hostinger
//   UPLOADS_PUBLIC_URL — URL pública que aponta pra mesma pasta (ex: https://seudominio.com/uploads)
// Opcional:
//   FTP_BASE_PATH — pasta remota onde salvar (padrão: /public_html/uploads)
//   FTP_SECURE — "false" pra desligar FTPS (padrão: ligado)
//   FTP_PORT — porta do servidor FTP (padrão: 21)
//   FTP_TLS_REJECT_UNAUTHORIZED — "true" pra exigir que o certificado TLS bata
//     exatamente com o host usado na conexão (padrão: desligado). A maioria das
//     hospedagens compartilhadas (Hostinger inclusive) serve um certificado
//     emitido pro domínio principal do servidor, não pro IP — então conectar
//     por IP com FTPS normalmente dá erro "Hostname/IP does not match
//     certificate's altnames" a menos que essa checagem fique desligada.

import { Client } from "basic-ftp";
import { Readable } from "stream";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export function uploadsConfigured(): boolean {
  return Boolean(env("FTP_HOST") && env("FTP_USER") && env("FTP_PASSWORD") && env("UPLOADS_PUBLIC_URL"));
}

interface UploadParams {
  buffer: Buffer;
  /** Caminho relativo dentro da pasta de uploads, ex: "empresas/abc123/logo/169-foto.jpg" */
  remotePath: string;
}

/** Envia o arquivo por FTP e devolve a URL pública final. */
export async function uploadFileToHostinger({ buffer, remotePath }: UploadParams): Promise<string> {
  if (!uploadsConfigured()) {
    throw new Error(
      "Upload de imagens não está configurado — faltam as variáveis FTP_HOST, FTP_USER, FTP_PASSWORD e/ou UPLOADS_PUBLIC_URL no ambiente."
    );
  }

  const host = env("FTP_HOST")!;
  const user = env("FTP_USER")!;
  const password = env("FTP_PASSWORD")!;
  const basePath = (env("FTP_BASE_PATH") ?? "/public_html/uploads").replace(/\/+$/, "");
  const secure = env("FTP_SECURE") !== "false";
  const port = env("FTP_PORT") ? Number(env("FTP_PORT")) : undefined;
  const secureOptions = { rejectUnauthorized: env("FTP_TLS_REJECT_UNAUTHORIZED") === "true" };
  const publicBaseUrl = env("UPLOADS_PUBLIC_URL")!.replace(/\/+$/, "");

  const segments = remotePath.split("/").filter(Boolean);
  const fileName = segments.pop();
  if (!fileName) throw new Error("Caminho de upload inválido.");
  const remoteDir = `${basePath}/${segments.join("/")}`;

  const client = new Client();
  client.ftp.verbose = false;
  try {
    await client.access({ host, user, password, secure, port, secureOptions });
    await client.ensureDir(remoteDir);
    await client.uploadFrom(Readable.from(buffer), fileName);
  } finally {
    client.close();
  }

  return `${publicBaseUrl}/${[...segments, fileName].join("/")}`;
}

/** Remove um arquivo enviado anteriormente (usado ao excluir foto da galeria). */
export async function deleteFileFromHostinger(remotePath: string): Promise<void> {
  if (!uploadsConfigured()) return;

  const host = env("FTP_HOST")!;
  const user = env("FTP_USER")!;
  const password = env("FTP_PASSWORD")!;
  const basePath = (env("FTP_BASE_PATH") ?? "/public_html/uploads").replace(/\/+$/, "");
  const secure = env("FTP_SECURE") !== "false";
  const port = env("FTP_PORT") ? Number(env("FTP_PORT")) : undefined;
  const secureOptions = { rejectUnauthorized: env("FTP_TLS_REJECT_UNAUTHORIZED") === "true" };

  const client = new Client();
  client.ftp.verbose = false;
  try {
    await client.access({ host, user, password, secure, port, secureOptions });
    await client.remove(`${basePath}/${remotePath.replace(/^\/+/, "")}`);
  } catch {
    // Se o arquivo já não existir ou o FTP falhar, não interrompe a exclusão no banco.
  } finally {
    client.close();
  }
}
