// ============================================================
// BuscaZapp — integração com o Mercado Pago (Checkout transparente/Bricks)
//
// Usado hoje só pelo Impulsionar (Painel → Impulsionar): a empresa
// escolhe o formato/duração e paga sem sair do site — o formulário de
// pagamento (Pix ou cartão de crédito) é renderizado ali mesmo na página
// pelo "Payment Brick" do Mercado Pago (script carregado no navegador).
// Quando a empresa confirma, o navegador manda os dados tokenizados pro
// nosso backend (POST /api/painel/boosts/[id]/pagar), que cria o
// pagamento de verdade direto na API do Mercado Pago com o Access Token.
// Depois, o Mercado Pago também chama nosso webhook
// (POST /api/webhooks/mercadopago) pra confirmar — é o que garante a
// liberação de um Pix mesmo se a pessoa fechar a aba antes da confirmação
// aparecer na tela.
//
// Requer as variáveis de ambiente MP_ACCESS_TOKEN (backend) e
// NEXT_PUBLIC_MP_PUBLIC_KEY (frontend, pra carregar o Payment Brick) —
// ver .env.example e HOSTINGER_MYSQL_SETUP.md.
// ============================================================

import { MercadoPagoConfig, Payment } from "mercadopago";

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

export function mpPaymentClient(): Payment {
  return new Payment(getConfig());
}

/** URL base do site, pra montar a URL do webhook mandada pro Mercado Pago. */
export function siteBaseUrl(): string {
  const v = process.env.SITE_BASE_URL;
  return (v && v.trim() !== "" ? v.trim() : "https://www.buscazap.com").replace(/\/+$/, "");
}
