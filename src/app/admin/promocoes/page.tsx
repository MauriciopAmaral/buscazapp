"use client";

import { useEffect, useMemo, useState } from "react";
import { Power, Trash2 } from "lucide-react";
import { DataTable, Badge, LoadingState, EmptyState, SearchInput } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Promotion, PromotionStatus } from "@/types";

const variant: Record<PromotionStatus, "success" | "warning" | "outline" | "danger"> = {
  ativa: "success",
  agendada: "warning",
  expirada: "outline",
  desativada: "danger",
};

type FiltroStatus = "todas" | PromotionStatus;

const FILTROS: { valor: FiltroStatus; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "ativa", label: "Ativas" },
  { valor: "agendada", label: "Agendadas" },
  { valor: "expirada", label: "Expiradas" },
  { valor: "desativada", label: "Desativadas" },
];

export default function AdminPromocoesPage() {
  const { token } = useAuth();
  const [promocoes, setPromocoes] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [termo, setTermo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/promotions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setPromocoes(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const results = useMemo(() => {
    return promocoes.filter((p) => {
      if (filtroStatus !== "todas" && p.status !== filtroStatus) return false;
      if (termo) {
        const alvo = `${p.titulo} ${p.companyNome ?? ""}`.toLowerCase();
        if (!alvo.includes(termo.toLowerCase())) return false;
      }
      return true;
    });
  }, [promocoes, termo, filtroStatus]);

  const alternarStatus = async (p: Promotion) => {
    if (!token) return;
    const novoStatus: PromotionStatus = p.status === "desativada" ? "ativa" : "desativada";
    setProcessando(p.id);
    try {
      const res = await fetch(`/api/admin/promotions/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setPromocoes((prev) => prev.map((x) => (x.id === p.id ? json.data : x)));
      } else {
        alert(json?.error?.message ?? "Não foi possível alterar o status.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const excluir = async (p: Promotion) => {
    if (!token) return;
    if (!confirm(`Excluir a promoção "${p.titulo}"? Não dá pra desfazer.`)) return;
    setProcessando(p.id);
    try {
      const res = await fetch(`/api/admin/promotions/${p.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setPromocoes((prev) => prev.filter((x) => x.id !== p.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir essa promoção.");
      }
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Promoções</h1>
      <p className="text-sm text-ink-500">{results.length} de {promocoes.length} promoções cadastradas na plataforma.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SearchInput value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por título ou empresa..." containerClassName="max-w-xs" />
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
          <EmptyState title="Nenhuma promoção encontrada" description="Ajuste a busca ou o filtro de status acima." />
        ) : (
          <DataTable
            data={results}
            rowKey={(p) => p.id}
            columns={[
              { key: "titulo", header: "Promoção", render: (p) => <span className="font-medium text-ink-900">{p.titulo}</span> },
              { key: "empresa", header: "Empresa", render: (p) => p.companyNome ?? "—" },
              { key: "preco", header: "Preço", render: (p) => `${formatCurrency(p.preco)} → ${formatCurrency(p.precoPromocional)}` },
              { key: "termino", header: "Até", render: (p) => formatDate(p.termino) },
              { key: "status", header: "Status", render: (p) => <Badge variant={variant[p.status]}>{p.status}</Badge> },
              {
                key: "acoes",
                header: "Ações",
                render: (p) => (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processando === p.id}
                      onClick={() => alternarStatus(p)}
                      className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
                      title={p.status === "desativada" ? "Reativar" : "Desativar"}
                    >
                      <Power size={13} /> {p.status === "desativada" ? "Ativar" : "Desativar"}
                    </button>
                    <button
                      type="button"
                      disabled={processando === p.id}
                      onClick={() => excluir(p)}
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
