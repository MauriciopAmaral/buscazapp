"use client";

import { useEffect, useMemo, useState } from "react";
import { Power, Trash2 } from "lucide-react";
import { DataTable, Badge, LoadingState, EmptyState, SearchInput } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Subscription } from "@/types";

type SubscriptionStatus = "ativa" | "cancelada" | "atrasada";

const variant: Record<SubscriptionStatus, "success" | "danger" | "outline"> = {
  ativa: "success",
  atrasada: "danger",
  cancelada: "outline",
};

type FiltroStatus = "todas" | SubscriptionStatus;

const FILTROS: { valor: FiltroStatus; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "ativa", label: "Ativas" },
  { valor: "atrasada", label: "Atrasadas" },
  { valor: "cancelada", label: "Canceladas" },
];

export default function AssinaturasPage() {
  const { token } = useAuth();
  const [assinaturas, setAssinaturas] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [termo, setTermo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/subscriptions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setAssinaturas(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const results = useMemo(() => {
    return assinaturas.filter((s) => {
      if (filtroStatus !== "todas" && s.status !== filtroStatus) return false;
      if (termo) {
        const alvo = `${s.companyNome ?? ""} ${s.planoNome ?? ""}`.toLowerCase();
        if (!alvo.includes(termo.toLowerCase())) return false;
      }
      return true;
    });
  }, [assinaturas, termo, filtroStatus]);

  const alternarStatus = async (s: Subscription) => {
    if (!token) return;
    const novoStatus: SubscriptionStatus = s.status === "cancelada" ? "ativa" : "cancelada";
    setProcessando(s.id);
    try {
      const res = await fetch(`/api/admin/subscriptions/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setAssinaturas((prev) => prev.map((x) => (x.id === s.id ? json.data : x)));
      } else {
        alert(json?.error?.message ?? "Não foi possível alterar o status.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const excluir = async (s: Subscription) => {
    if (!token) return;
    if (!confirm(`Excluir a assinatura de "${s.companyNome}"? Não dá pra desfazer.`)) return;
    setProcessando(s.id);
    try {
      const res = await fetch(`/api/admin/subscriptions/${s.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setAssinaturas((prev) => prev.filter((x) => x.id !== s.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir essa assinatura.");
      }
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Assinaturas</h1>
      <p className="text-sm text-ink-500">{results.length} de {assinaturas.length} assinaturas registradas.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SearchInput value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por empresa ou plano..." containerClassName="max-w-xs" />
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-ink-200 bg-white p-1">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setFiltroStatus(f.valor)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filtroStatus === f.valor ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <LoadingState rows={3} />
        ) : results.length === 0 ? (
          <EmptyState title="Nenhuma assinatura encontrada" description="Ajuste a busca ou o filtro de status acima." />
        ) : (
          <DataTable
            data={results}
            rowKey={(s) => s.id}
            columns={[
              { key: "empresa", header: "Empresa", render: (s) => s.companyNome ?? "—" },
              { key: "plano", header: "Plano", render: (s) => s.planoNome ?? s.planoId },
              { key: "periodicidade", header: "Periodicidade", render: (s) => <span className="capitalize">{s.periodicidade}</span> },
              { key: "valor", header: "Valor", render: (s) => formatCurrency(s.valor) },
              { key: "proximaCobranca", header: "Próxima cobrança", render: (s) => formatDate(s.proximaCobranca) },
              {
                key: "status",
                header: "Status",
                render: (s) => <Badge variant={variant[s.status]}>{s.status}</Badge>,
              },
              {
                key: "acoes",
                header: "Ações",
                render: (s) => (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processando === s.id}
                      onClick={() => alternarStatus(s)}
                      className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
                      title={s.status === "cancelada" ? "Reativar" : "Cancelar"}
                    >
                      <Power size={13} /> {s.status === "cancelada" ? "Reativar" : "Cancelar"}
                    </button>
                    <button
                      type="button"
                      disabled={processando === s.id}
                      onClick={() => excluir(s)}
                      className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 size={13} /> Excluir
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
