// ============================================================
// BuscaZapp — utilidades de autenticação da API
//
// Autenticação baseada em token (JWT), não em cookie de sessão de
// navegador. Escolha deliberada: o mesmo endpoint de login vai ser
// usado pelo site (Next.js) e, mais pra frente, pelos apps Android/iOS
// — e apps nativos não têm cookie de navegador, então o token no
// header "Authorization: Bearer <token>" funciona igual nos dois.
// ============================================================

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { UserRole } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET ?? process.env.AUTH_SECRET;
const TOKEN_EXPIRES_IN = "30d";

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  // Não derruba o build, mas fica bem visível no log do servidor.
  console.error(
    "[auth] JWT_SECRET/AUTH_SECRET não configurado — defina essa variável de ambiente antes de aceitar tráfego real."
  );
}

export interface AuthTokenPayload {
  sub: string; // userId
  role: UserRole;
  companyId?: string | null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET ?? "dev-only-insecure-secret", {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET ?? "dev-only-insecure-secret") as AuthTokenPayload;
  } catch {
    return null;
  }
}
