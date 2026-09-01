"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { User, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (
    nome: string,
    email: string,
    senha: string,
    role: "consumidor" | "empresa"
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Atalho de desenvolvimento: loga com uma das contas de teste já semeadas no banco. */
  loginAs: (role: UserRole) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  /**
   * Atualiza a sessão com um token/usuário novos vindos de outra rota que não
   * seja /auth/login ou /auth/register — hoje usado depois de criar uma
   * empresa (POST /api/painel/company/create), que devolve um token novo já
   * com o companyId embutido, já que o token antigo não tem esse campo.
   */
  setSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "buscazapp:token";
const USER_KEY = "buscazapp:user";

// Contas de teste criadas pelo prisma/seed.ts — senha padrão "123456" pra todas,
// exceto a que veio do banco antigo (que mantém o hash original).
const CONTAS_DEV: Record<UserRole, { email: string; senha: string }> = {
  consumidor: { email: "maria.eduarda@email.com", senha: "123456" },
  empresa: { email: "marcos@pizzariatitan.com.br", senha: "123456" },
  admin: { email: "admin@buscazapp.com.br", senha: "123456" },
};

async function apiCall<T>(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { ok: false, error: json?.error?.message ?? "Não foi possível completar a operação." };
    }
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, error: "Não foi possível conectar ao servidor. Tente novamente." };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let storedToken: string | null = null;
      let storedUser: User | null = null;
      try {
        storedToken = window.localStorage.getItem(TOKEN_KEY);
        const rawUser = window.localStorage.getItem(USER_KEY);
        if (rawUser) storedUser = JSON.parse(rawUser);
      } catch {
        // ignora
      }

      if (!storedToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      // Mostra o usuário salvo localmente na hora, e confirma com o servidor em seguida.
      if (!cancelled && storedUser) setToken(storedToken);
      if (!cancelled && storedUser) setUser(storedUser);

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const json = await res.json().catch(() => null);
        if (!cancelled) {
          if (res.ok && json?.success) {
            setUser(json.data);
            setToken(storedToken);
            window.localStorage.setItem(USER_KEY, JSON.stringify(json.data));
          } else {
            // token expirado/inválido
            window.localStorage.removeItem(TOKEN_KEY);
            window.localStorage.removeItem(USER_KEY);
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        // sem conexão: mantém o que estava salvo localmente
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  function persist(newToken: string, newUser: User) {
    setToken(newToken);
    setUser(newUser);
    try {
      window.localStorage.setItem(TOKEN_KEY, newToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch {
      // ignora
    }
  }

  const login: AuthContextValue["login"] = async (email, senha) => {
    const result = await apiCall<{ token: string; user: User }>("/auth/login", { email, senha });
    if (!result.ok) return result;
    persist(result.data.token, result.data.user);
    return { ok: true };
  };

  const register: AuthContextValue["register"] = async (nome, email, senha, role) => {
    const result = await apiCall<{ token: string; user: User }>("/auth/register", {
      nome,
      email,
      senha,
      role,
    });
    if (!result.ok) return result;
    persist(result.data.token, result.data.user);
    return { ok: true };
  };

  const loginAs: AuthContextValue["loginAs"] = async (role) => {
    const conta = CONTAS_DEV[role];
    return login(conta.email, conta.senha);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // ignora
    }
  };

  const setSession: AuthContextValue["setSession"] = (newToken, newUser) => {
    persist(newToken, newUser);
  };

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, loginAs, logout, setSession }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- login/register/loginAs/logout/setSession são recriadas a cada render mas não dependem de nada além do setState estável
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
