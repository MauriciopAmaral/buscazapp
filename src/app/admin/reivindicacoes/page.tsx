"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { DataTable, Badge, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import { ClaimStatus } from "@/types";

const statusVariant: Record<ClaimStatus, "outline" | "warning" | "brand" | "success" | "danger"> = {
  novo: "outline",
  aguardando_validacao: "warning",
  em_analise: "brand",
  aprovado: "success",
  rejeitado: "danger",
};

const statusLabel: Record<ClaimStatus, string> = {
  novo: "Novo",
  aguardando_validacao: "Aguardando validação",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

interface ClaimRow {
  id: string;
  companyId: string;
  companyNome: string;
  companySlug: string;
  usuario: string;
  metodo: string;
  status: ClaimStatus;
  data: string;
}

export default function ReivindicacoesPage() {
  const { token } = useAuth();
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/admin/claims", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json?.success) setClaims(json.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const updateStatus = async (id: string, status: ClaimStatus) => {
    if (!token) return;
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Reivindicações</h1>
      <p className="text-sm text-ink-500">Aprove ou rejeite solicitações de administração de perfis.</p>
      <p className="mt-1 text-xs text-ink-400">
        Aprovar vincula automaticamente a conta que pediu como dona da empresa (o painel dela passa a mostrar os
        dados reais). A validação de e-mail/telefone/documento em si ainda é simulada — confira manualmente antes
        de aprovar.
      </p>

      <div className="mt-4">
        {loading ? (
          <LoadingState rows={2} />
        ) : (
          <DataTable
            data={claims}
            rowKey={(c) => c.id}
            emptyTitle="Nenhuma reivindicação registrada"
            columns={[
              {
                key: "empresa",
                header: "Empresa",
                render: (c) => (
                  <Link href={`/empresa/${c.companySlug}`} target="_blank" className="font-medium text-ink-900 hover:underline">
                    {c.companyNome}
                  </Link>
                ),
              },
              { key: "usuario", header: "Usuário", render: (c) => c.usuario },
              { key: "metodo", header: "Método", render: (c) => <span className="capitalize">{c.metodo}</span> },
              { key: "data", header: "Data", render: (c) => formatDate(c.data) },
              { key: "status", header: "Status", render: (c) => <Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge> },
              {
                key: "acoes",
                header: "Ações",
                render: (c) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStatus(c.id, "aprovado")}
                      disabled={updating === c.id || c.status === "aprovado"}
                      className="text-ink-500 hover:text-emerald-600 disabled:opacity-40"
                      title="Aprovar"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={() => updateStatus(c.id, "rejeitado")}
                      disabled={updating === c.id || c.status === "rejeitado"}
                      className="text-ink-500 hover:text-red-600 disabled:opacity-40"
                      title="Rejeitar"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
