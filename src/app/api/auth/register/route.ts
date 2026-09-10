import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAuthToken } from "@/lib/auth";
import { badRequest, conflict, created, serverError } from "@/lib/apiResponse";
import { sendEmail, emailLayout } from "@/lib/emailSender";

const NOMES_PLANO: Record<string, string> = {
  gratuito: "Gratuito",
  pro: "Pro",
  premium: "Premium",
  premium_plus: "Premium+",
};

/** E-mail "cadastro realizado com sucesso" — só é mandado quando o
 * cadastro veio de um link de compra de plano pago (planoToken válido),
 * confirmando os dados de acesso (login = e-mail, senha = a que a pessoa
 * acabou de escolher no formulário) e agradecendo pela adesão. A senha em
 * texto puro só existe neste momento (antes de virar hash) — nunca fica
 * salva em lugar nenhum, é só ecoada de volta uma vez, por e-mail. */
async function enviarEmailBoasVindas(params: { nome: string; email: string; senha: string; planoId?: string }) {
  const nomePlano = params.planoId ? NOMES_PLANO[params.planoId] ?? params.planoId : null;
  await sendEmail({
    to: params.email,
    subject: "Cadastro realizado com sucesso — bem-vindo ao BuscaZapp!",
    html: emailLayout(
      "Boas-vindas",
      `
      <h1 style="font-size:18px; color:#111827; margin:0 0 12px;">Cadastro realizado com sucesso! 🎉</h1>
      <p style="font-size:14px; color:#374151; line-height:1.6;">
        Olá, ${params.nome}! Muito obrigado por se juntar ao BuscaZapp${nomePlano ? ` com o plano <strong>${nomePlano}</strong>` : ""}.
        Sua conta já está pronta pra usar — aqui estão seus dados de acesso ao painel:
      </p>
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:14px; margin:16px 0; font-size:13px; color:#111827;">
        <p style="margin:0 0 6px;"><strong>Login:</strong> ${params.email}</p>
        <p style="margin:0;"><strong>Senha:</strong> ${params.senha}</p>
      </div>
      <p style="font-size:12px; color:#9ca3af;">
        Recomendamos trocar essa senha assim que possível, em Painel → Configurações.
      </p>`
    ),
  });
}

// POST /api/auth/register
// Body: { nome, email, senha, role?: "consumidor" | "empresa", planoToken?: string }
//
// Cria um usuário consumidor ou empresa. Empresas nascem sem
// `companyId` — vinculam a um perfil de empresa depois, pelo fluxo de
// "Reivindicar" (POST /api/claims) ou quando um admin aprova o cadastro.
//
// `planoToken` (opcional): quando o cadastro veio de um link de e-mail
// mandado depois da compra de um plano pago (src/lib/planPurchasePayment.ts),
// esse token vincula essa compra ao usuário recém-criado — o plano é
// efetivamente aplicado depois, quando a empresa é criada em
// POST /api/painel/company/create. Também dispara o e-mail de boas-vindas
// com os dados de acesso.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body?.senha === "string" ? body.senha : "";
    const role = body?.role === "empresa" ? "empresa" : "consumidor";
    const planoToken = typeof body?.planoToken === "string" ? body.planoToken.trim() : "";

    if (!nome || !email || !senha) {
      return badRequest("Informe nome, e-mail e senha.");
    }
    if (senha.length < 6) {
      return badRequest("A senha precisa ter pelo menos 6 caracteres.");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return conflict("Já existe uma conta com esse e-mail.");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipos reais do Prisma só existem depois de `prisma generate`, ver AGENTS.md
    let planPurchase: any = null;
    if (planoToken) {
      const purchase = await prisma.planPurchase.findUnique({ where: { cadastroToken: planoToken } });
      if (purchase && purchase.status === "pago" && !purchase.userId) {
        planPurchase = purchase;
      }
    }

    const senhaHash = await hashPassword(senha);
    const user = await prisma.user.create({
      data: { nome, email, senhaHash, role },
    });

    if (planPurchase) {
      await prisma.planPurchase.update({ where: { id: planPurchase.id }, data: { userId: user.id } });
      await enviarEmailBoasVindas({ nome, email, senha, planoId: planPurchase.planoId }).catch((err) =>
        console.error("[POST /api/auth/register] falha ao enviar e-mail de boas-vindas", err)
      );
    }

    const token = signAuthToken({ sub: user.id, role: user.role, companyId: user.companyId });

    return created({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      planoToken: planPurchase ? planoToken : undefined,
    });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return serverError();
  }
}
