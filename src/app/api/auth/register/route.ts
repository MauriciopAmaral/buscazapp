import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAuthToken } from "@/lib/auth";
import { badRequest, conflict, created, serverError } from "@/lib/apiResponse";

// POST /api/auth/register
// Body: { nome, email, senha, role?: "consumidor" | "empresa" }
//
// Cria um usuário consumidor ou empresa. Empresas nascem sem
// `companyId` — vinculam a um perfil de empresa depois, pelo fluxo de
// "Reivindicar" (POST /api/claims) ou quando um admin aprova o cadastro.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body?.senha === "string" ? body.senha : "";
    const role = body?.role === "empresa" ? "empresa" : "consumidor";

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

    const senhaHash = await hashPassword(senha);
    const user = await prisma.user.create({
      data: { nome, email, senhaHash, role },
    });

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
    });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return serverError();
  }
}
