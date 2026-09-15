import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteBaseUrl } from "@/lib/mercadopago";
import { sendEmail, emailLayout } from "@/lib/emailSender";
import { NOMES_PLANO } from "@/lib/subscriptionChangePayment";

const DIAS_ANTES_DO_VENCIMENTO = 3;

function cronAutorizado(request: NextRequest): boolean {
  const segredo = process.env.CRON_SECRET;
  // Sem CRON_SECRET configurado, não bloqueia (facilita testar em
  // desenvolvimento) — mas em produção é fortemente recomendado configurar,
  // senão qualquer um poderia chamar essa rota e disparar e-mails.
  if (!segredo) return true;
  return request.headers.get("authorization") === `Bearer ${segredo}`;
}

/** "2026-09-14", só a data — pra comparar "já mandei o lembrete hoje?" sem se importar com hora/minuto. */
function soAData(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function enviarLembreteClube(sub: {
  id: string;
  valor: unknown;
  proximaCobranca: Date;
  user: { email: string; nome: string };
}) {
  const link = `${siteBaseUrl()}/clube`;
  const dataFormatada = sub.proximaCobranca.toLocaleDateString("pt-BR");

  await sendEmail({
    to: sub.user.email,
    subject: "Sua assinatura do BuscaZapp Clube vence em breve",
    html: emailLayout(
      "Lembrete de vencimento — Clube",
      `
      <h1 style="font-size:18px; color:#111827; margin:0 0 12px;">Sua assinatura do Clube vence em breve</h1>
      <p style="font-size:14px; color:#374151; line-height:1.6;">
        Olá, ${sub.user.nome}! Sua assinatura do <strong>BuscaZapp Clube</strong> vence em
        <strong>${dataFormatada}</strong>. Renove agora pra continuar com acesso aos cupons exclusivos de 2x1
        nos restaurantes parceiros.
      </p>
      <div style="text-align:center; margin:22px 0;">
        <a href="${link}" style="display:inline-block; background:#16a34a; color:#fff; text-decoration:none; font-weight:600; font-size:14px; padding:12px 22px; border-radius:10px;">
          Renovar agora
        </a>
      </div>
      <p style="font-size:12px; color:#9ca3af;">
        Se o botão não funcionar, copie e cole este link no navegador:<br/>
        <a href="${link}" style="color:#16a34a;">${link}</a>
      </p>`
    ),
  });
  return true;
}

async function enviarLembrete(sub: {
  id: string;
  planoId: string;
  periodicidade: string;
  proximaCobranca: Date;
  valor: unknown;
  company: { email: string | null; nomeFantasia: string };
}) {
  if (!sub.company.email) return false;
  const nomePlano = NOMES_PLANO[sub.planoId] ?? sub.planoId;
  const link = `${siteBaseUrl()}/painel/financeiro?renovar=1`;
  const dataFormatada = sub.proximaCobranca.toLocaleDateString("pt-BR");

  await sendEmail({
    to: sub.company.email,
    subject: `Sua assinatura ${nomePlano} vence em breve — pague agora e evite interrupção`,
    html: emailLayout(
      "Lembrete de vencimento",
      `
      <h1 style="font-size:18px; color:#111827; margin:0 0 12px;">Sua assinatura vence em breve</h1>
      <p style="font-size:14px; color:#374151; line-height:1.6;">
        Olá! A assinatura <strong>${nomePlano}</strong> (${sub.periodicidade}) de <strong>${sub.company.nomeFantasia}</strong>
        vence em <strong>${dataFormatada}</strong>. Pague agora pra continuar com o plano ativo sem interrupção.
      </p>
      <div style="text-align:center; margin:22px 0;">
        <a href="${link}" style="display:inline-block; background:#16a34a; color:#fff; text-decoration:none; font-weight:600; font-size:14px; padding:12px 22px; border-radius:10px;">
          Pagar agora
        </a>
      </div>
      <p style="font-size:12px; color:#9ca3af;">
        Se o botão não funcionar, copie e cole este link no navegador:<br/>
        <a href="${link}" style="color:#16a34a;">${link}</a>
      </p>`
    ),
  });
  return true;
}

// GET /api/cron/lembretes-assinatura — chamado 1x por dia por uma tarefa
// agendada da Vercel (ver vercel.json), NÃO por uma pessoa. Procura
// assinaturas ativas com vencimento nos próximos alguns dias e manda um
// e-mail de lembrete com o link pra pagar (Painel → Financeiro, que com
// `?renovar=1` já abre direto o pagamento do mesmo plano/período — ver
// src/app/painel/financeiro/FinanceiroClient.tsx).
//
// Como o sistema não guarda cartão pra cobrar sozinho (cada troca/renovação
// de plano é sempre feita pela própria empresa, no Payment Brick embutido),
// esse lembrete por e-mail é o mecanismo real de cobrança recorrente.
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const agora = new Date();
    const limite = new Date(agora.getTime() + DIAS_ANTES_DO_VENCIMENTO * 24 * 60 * 60 * 1000);
    const hoje = soAData(agora);

    const subs = await prisma.subscription.findMany({
      where: { status: "ativa", proximaCobranca: { gte: agora, lte: limite } },
      include: { company: { select: { email: true, nomeFantasia: true } } },
    });

    let enviados = 0;
    for (const sub of subs) {
      const jaEnviadoHoje = sub.lembreteEnviadoEm && soAData(sub.lembreteEnviadoEm) === hoje;
      if (jaEnviadoHoje) continue;

      const foiEnviado = await enviarLembrete(sub).catch((err) => {
        console.error("[cron lembretes-assinatura] falha ao enviar lembrete", sub.id, err);
        return false;
      });
      if (foiEnviado) {
        await prisma.subscription.update({ where: { id: sub.id }, data: { lembreteEnviadoEm: agora } });
        enviados++;
      }
    }

    const clubSubs = await prisma.clubSubscription.findMany({
      where: { status: "ativa", proximaCobranca: { gte: agora, lte: limite } },
      include: { user: { select: { email: true, nome: true } } },
    });

    let enviadosClube = 0;
    for (const sub of clubSubs) {
      const jaEnviadoHoje = sub.lembreteEnviadoEm && soAData(sub.lembreteEnviadoEm) === hoje;
      if (jaEnviadoHoje) continue;

      const foiEnviado = await enviarLembreteClube(sub).catch((err) => {
        console.error("[cron lembretes-assinatura] falha ao enviar lembrete do Clube", sub.id, err);
        return false;
      });
      if (foiEnviado) {
        await prisma.clubSubscription.update({ where: { id: sub.id }, data: { lembreteEnviadoEm: agora } });
        enviadosClube++;
      }
    }

    return NextResponse.json({
      ok: true,
      verificados: subs.length + clubSubs.length,
      enviados: enviados + enviadosClube,
    });
  } catch (err) {
    console.error("[GET /api/cron/lembretes-assinatura]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
