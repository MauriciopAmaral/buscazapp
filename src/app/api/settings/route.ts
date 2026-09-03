import { ok, serverError } from "@/lib/apiResponse";
import { getOrCreateSettings } from "@/lib/settings";

// GET /api/settings — versão pública e mínima das configurações da
// plataforma. Usada pelo Proxy (src/proxy.ts) pra saber se o modo
// manutenção está ligado antes de deixar passar uma página pública, e
// também podia alimentar coisas como o e-mail de suporte no rodapé.
// Não expõe nada sensível (sem os toggles internos de notificação).
export async function GET() {
  try {
    const settings = await getOrCreateSettings();
    return ok({
      nomePlataforma: settings.nomePlataforma,
      emailSuporte: settings.emailSuporte,
      modoManutencao: settings.modoManutencao,
    });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return serverError();
  }
}
