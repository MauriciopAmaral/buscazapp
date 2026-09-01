"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { companies } from "@/mocks/companies";
import { Company } from "@/types";

/**
 * Empresa do usuário logado (protótipo / mock) — ainda usado pelas telas do
 * painel que não têm endpoint próprio na API ainda (produtos, serviços,
 * promoções, estatísticas, financeiro, assinatura, avaliações, leads, fotos,
 * configurações). Continua síncrono de propósito, pra não quebrar essas
 * telas — ver `useCurrentCompanyLive` pras telas já conectadas na API real
 * (Minha empresa, Cupons).
 */
export function useCurrentCompany() {
  const { user } = useAuth();
  return companies.find((c) => c.id === user?.companyId) ?? companies[0];
}

/**
 * Versão "de verdade" — busca a empresa do usuário logado em
 * GET /api/painel/company, com o token da sessão. `company` fica `null`
 * enquanto carrega ou se a conta ainda não tem empresa vinculada.
 */
export function useCurrentCompanyLive() {
  const { token } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setCompany(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/painel/company", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setCompany(json.data);
      } else {
        setCompany(null);
        setError(json?.error?.message ?? "Não foi possível carregar sua empresa.");
      }
    } catch {
      setCompany(null);
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca a empresa do usuário logado ao montar/trocar de token
    refresh();
  }, [refresh]);

  return { company, loading, error, refresh };
}
