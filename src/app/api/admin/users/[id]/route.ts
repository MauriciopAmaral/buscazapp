import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserWithRole } from "@/lib/apiAuth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/apiResponse";
import { hashPassword } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tipo real do Prisma só existe depois de `prisma generate`, ver AGENTS.md
function mapUser(user: any) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    companyId: user.companyId ?? undefined,
    companyNome: user.company?.nomeFantasia,
    companySlug: user.company?.slug,
    clubeAssinante: user.clubeAssinante,
    criadoEm: user.createdAt.toISOString(),
  };
}

// PATCH /api/admin/users/[id] — ferramenta de suporte do admin: trocar
// nome/e-mail, papel (role), vincular/desvincular de uma empresa, e
// redefinir a senha manualmente (quando a pessoa perde acesso e não dá
// pra usar o "esqueci minha senha" — ex: e-mail não configurado ainda).
// Body aceita qualquer subconjunto de: { nome, email, role, companyId, novaSenha }
// companyId: "" ou null pra desvincular.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Corpo da requisição inválido.");

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return notFound("Usuário não encontrado.");

    const data: {
      role?: "consumidor" | "empresa" | "admin";
      companyId?: string | null;
      nome?: string;
      email?: string;
      senhaHash?: string;
    } = {};

    if (typeof body.nome === "string") {
      const nome = body.nome.trim();
      if (!nome) return badRequest("O nome não pode ficar vazio.");
      data.nome = nome;
    }

    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!email || !email.includes("@")) return badRequest("E-mail inválido.");
      if (email !== existing.email) {
        const emailEmUso = await prisma.user.findUnique({ where: { email } });
        if (emailEmUso) return badRequest("Já existe uma conta com esse e-mail.");
      }
      data.email = email;
    }

    if (typeof body.novaSenha === "string" && body.novaSenha.length > 0) {
      if (body.novaSenha.length < 6) return badRequest("A nova senha precisa ter pelo menos 6 caracteres.");
      data.senhaHash = await hashPassword(body.novaSenha);
    }

    if (typeof body.role === "string") {
      if (!["consumidor", "empresa", "admin"].includes(body.role)) {
        return badRequest("Papel inválido.");
      }
      data.role = body.role;
    }

    if ("companyId" in body) {
      const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
      if (!companyId) {
        data.companyId = null;
      } else {
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return badRequest("Empresa não encontrada.");
        data.companyId = companyId;
      }
    }

    if (Object.keys(data).length === 0) {
      return badRequest("Nenhum campo válido pra atualizar.");
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { company: { select: { nomeFantasia: true, slug: true } } },
    });

    return ok(mapUser(user));
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]]", err);
    return serverError();
  }
}

// DELETE /api/admin/users/[id] — remove a conta definitivamente. Favoritos,
// tokens de redefinição de senha e transações de cashback têm onDelete:
// Cascade no schema; reivindicações (Claim.userId) não têm — são
// desvinculadas antes, numa transação, pra não falhar por causa da
// constraint. A empresa vinculada (se houver) não é apagada, só fica sem
// esse usuário — o admin faz isso separadamente em Empresas, se for o caso.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUserWithRole(request, ["admin"]);
    if (!auth) return unauthorized("Faça login como administrador.");

    const { id } = await params;
    if (id === auth.sub) return forbidden("Você não pode excluir a própria conta enquanto está logado nela.");

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return notFound("Usuário não encontrado.");

    await prisma.$transaction([
      prisma.claim.updateMany({ where: { userId: id }, data: { userId: null } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return ok({ excluido: true });
  } catch (err) {
    console.error("[DELETE /api/admin/users/[id]]", err);
    return serverError();
  }
}
