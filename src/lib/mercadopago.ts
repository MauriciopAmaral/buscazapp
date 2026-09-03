// ============================================================
// BuscaZapp — integração com o Mercado Pago (Checkout Pro)
//
// Usado hoje só pelo Impulsionar (Painel → Impulsionar): a empresa
// escolhe o formato/duração, a gente cria uma "preferência" de pagamento
// no Mercado Pago e redireciona pra lá (cartão, Pix, boleto — quem decide
// é o próprio Mercado Pago, não a gente). Depois do pagamento, o Mercado
// Pago chama nosso webhook (POST /api/webhooks/mercadopago) pra confirmar,
// e é só nesse momento que o impulsionamento é liberado — nunca antes,
// pra não liberar nada sem o pagamento estar realmente aprovado.
//
// Requer a variável de ambiente MP_ACCESS_TOKEN (ver .env.example e
// HOSTINGER_MYSQL_SETUP.md).
// ============================================================

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function accessToken(): string | undefined {
  const v = process.env.MP_ACCESS_TOKEN;
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export function mpConfigured(): boolean {
  return Boolean(accessToken());
}

let config: MercadoPagoConfig | null = null;

function getConfig(): MercadoPagoConfig {
  if (!config) {
    const token = accessToken();
    if (!token) throw new Error("MP_ACCESS_TOKEN não configurado.");
    config = new MercadoPagoConfig({ accessToken: token });
  }
  return config;
}

export function mpPreferenceClient(): Preference {
  return new Preference(getConfig());
}

export function mpPaymentClient(): Payment {
  return new Payment(getConfig());
}

/** URL base do site, pra montar as URLs de retorno/webhook mandadas pro Mercado Pago. */
export function siteBaseUrl(): string {
  const v = process.env.SITE_BASE_URL;
  return (v && v.trim() !== "" ? v.trim() : "https://www.buscazap.com").replace(/\/+$/, "");
}
