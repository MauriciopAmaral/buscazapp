// ============================================================
// BuscaZapp — envio de e-mails transacionais (Resend)
//
// Usa a API HTTP do Resend direto (fetch), sem SDK — evita adicionar mais
// uma dependência só pra isso. Precisa de duas variáveis de ambiente na
// Vercel: RESEND_API_KEY (chave de API do Resend) e RESEND_FROM_EMAIL (o
// remetente, ex: "BuscaZapp <contato@buscazap.com>" — precisa ser um
// domínio verificado no Resend).
//
// Se RESEND_API_KEY não estiver configurada (ex: neste sandbox de
// desenvolvimento, que não tem acesso à internet pra chamar a API do
// Resend), o e-mail não é enviado de verdade — só fica registrado no
// console, pra não quebrar o fluxo de pagamento/cadastro em ambiente sem
// e-mail configurado. Isso é só um efeito colateral opcional (avisar por
// e-mail); todas as regras de negócio importantes (pagamento aprovado,
// cadastro criado) já acontecem no banco antes de tentar mandar o e-mail.
// ============================================================

function resendApiKey(): string | undefined {
  const v = process.env.RESEND_API_KEY;
  return v && v.trim() !== "" ? v.trim() : undefined;
}

function fromEmail(): string {
  const v = process.env.RESEND_FROM_EMAIL;
  return v && v.trim() !== "" ? v.trim() : "BuscaZapp <onboarding@resend.dev>";
}

export function emailConfigured(): boolean {
  return Boolean(resendApiKey());
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/** Manda um e-mail transacional. Nunca lança — um e-mail que falhar só fica
 * registrado no log; quem chamou (o fluxo de pagamento/cadastro) já
 * concluiu a parte que importa no banco antes de chegar aqui. */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  if (!resendApiKey()) {
    console.warn(`[emailSender] RESEND_API_KEY não configurada — e-mail NÃO enviado (só logado). Para: ${to} — Assunto: ${subject}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromEmail(), to: [to], subject, html }),
    });
    if (!res.ok) {
      const detalhe = await res.text().catch(() => "");
      console.error(`[emailSender] falha ao enviar e-mail (status ${res.status})`, detalhe);
    }
  } catch (err) {
    console.error("[emailSender] falha ao enviar e-mail", err);
  }
}

/** Layout HTML simples e consistente pra todos os e-mails transacionais. */
export function emailLayout(tituloInterno: string, corpoHtml: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <div style="text-align:center; margin-bottom: 20px;">
      <span style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:14px; background:#16a34a; color:#fff; font-size:20px; font-weight:700;">B</span>
    </div>
    <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; padding:28px;">
      ${corpoHtml}
    </div>
    <p style="text-align:center; color:#9ca3af; font-size:12px; margin-top:20px;">
      BuscaZapp · ${tituloInterno}
    </p>
  </div>`;
}
