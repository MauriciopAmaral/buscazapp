// ============================================================
// BuscaZapp — leitura do usuário autenticado dentro de uma rota de API
// ============================================================

import { NextRequest } from "next/server";
import { verifyAuthToken, AuthTokenPayload } from "./auth";
import type { UserRole } from "@/types";

export function getAuthUser(request: NextRequest): AuthTokenPayload | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;
  return verifyAuthToken(token);
}

/** Retorna o usuário autenticado, ou null se não estiver logado ou não tiver um dos papéis exigidos. */
export function getAuthUserWithRole(
  request: NextRequest,
  roles?: UserRole[]
): AuthTokenPayload | null {
  const user = getAuthUser(request);
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return user;
}
