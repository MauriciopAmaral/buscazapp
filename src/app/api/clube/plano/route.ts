import { ok, serverError } from "@/lib/apiResponse";
import { getOrCreateSettings } from "@/lib/settings";

// GET /api/clube/plano — valor atual da assinatura do BuscaZapp Clube (sem
// autenticação, pra mostrar na página pública /clube antes de logar).
// Editável em Admin → Configurações (PlatformSettings.clubeValorMensal),
// sem precisar mexer em código.
export async function GET() {
  try {
    const settings = await getOrCreateSettings();
    return ok({ valorMensal: Number(settings.clubeValorMensal) });
  } catch (err) {
    console.error("[GET /api/clube/plano]", err);
    return serverError();
  }
}
