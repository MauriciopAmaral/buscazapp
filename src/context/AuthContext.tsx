"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { users } from "@/mocks/users";

interface AuthContextValue {
  user: User | null;
  loginAs: (role: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "buscazapp:user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega sessão persistida ao montar
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignora
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinaliza fim do carregamento inicial
    setIsLoading(false);
  }, []);

  const loginAs = (role: UserRole) => {
    const found = users.find((u) => u.role === role) ?? null;
    setUser(found);
    try {
      if (found) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    } catch {
      // ignora
    }
  };

  const logout = () => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignora
    }
  };

  const value = useMemo(() => ({ user, loginAs, logout, isLoading }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
