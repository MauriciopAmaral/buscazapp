"use client";

import { useEffect, useMemo, useState } from "react";
import { Power, Trash2 } from "lucide-react";
import { DataTable, Badge, LoadingState, EmptyState, SearchInput } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatDate, cn } from "@/lib/utils";
import { Coupon, CouponStatus } from "@/types";

const variant: Record<CouponStatus, "success" | "outline" | "ink" | "danger"> = {
  ativo: "success",
  expirado: "outline",
  utilizado: "ink",
  desativado: "danger",
};

type FiltroStatus = "todos" | CouponStatus;

const FILTROS: { valor: FiltroStatus; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "ativo", label: "Ativos" },
  { valor: "expirado", label: "Expirados" },
  { valor: "utilizado", label: "Utilizados" },
  { valor: "desativado", label: "Desativados" },
];

export default function AdminCuponsPage() {
  const { token } = useAuth();
  const [cupons, setCupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [termo, setTermo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/coupons", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setCupons(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const results = useMemo(() => {
    return cupons.filter((c) => {
      if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
      if (termo) {
        const alvo = `${c.titulo} ${c.codigo} ${c.companyNome ?? ""}`.toLowerCase();
        if (!alvo.includes(termo.toLowerCase())) return false;
      }
      return true;
    });
  }, [cupons, termo, filtroStatus]);

  const alternarStatus = async (c: Coupon) => {
    if (!token) return;
    const novoStatus: CouponStatus = c.status === "desativado" ? "ativo" : "desativado";
    setProcessando(c.id);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setCupons((prev) => prev.map((x) => (x.id === c.id ? json.data : x)));
      } else {
        alert(json?.error?.message ?? "Não foi possível alterar o status.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const excluir = async (c: Coupon) => {
    if (!token) return;
    if (!confirm(`Excluir o cupom "${c.titulo}" (${c.codigo})? Não dá pra desfazer.`)) return;
    setProcessando(c.id);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setCupons((prev) => prev.filter((x) => x.id !== c.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir esse cupom.");
      }
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Cupons</h1>
      <p className="text-sm text-ink-500">{results.length} de {cupons.length} cupons cadastrados na plataforma.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SearchInput value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por título, código ou empresa..." containerClassName="max-w-xs" />
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
          <EmptyState title="Nenhum cupom encontrado" description="Ajuste a busca ou o filtro de status acima." />
        ) : (
          <DataTable
            data={results}
            rowKey={(c) => c.id}
            columns={[
              { key: "titulo", header: "Cupom", render: (c) => <span className="font-medium text-ink-900">{c.titulo}</span> },
              { key: "empresa", header: "Empresa", render: (c) => c.companyNome ?? "—" },
              { key: "codigo", header: "Código", render: (c) => <code className="text-xs">{c.codigo}</code> },
              { key: "uso", header: "Uso", render: (c) => `${c.utilizados}/${c.limite}` },
              { key: "validade", header: "Validade", render: (c) => formatDate(c.validade) },
              { key: "status", header: "Status", render: (c) => <Badge variant={variant[c.status]}>{c.status}</Badge> },
              {
                key: "acoes",
                header: "Ações",
                render: (c) => (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processando === c.id}
                      onClick={() => alternarStatus(c)}
                      className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
                      title={c.status === "desativado" ? "Reativar" : "Desativar"}
                    >
                      <Power size={13} /> {c.status === "desativado" ? "Ativar" : "Desativar"}
                    </button>
                    <button
                      type="button"
                      disabled={processando === c.id}
                      onClick={() => excluir(c)}
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
