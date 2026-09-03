"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { DataTable, Badge, LoadingState, EmptyState, SearchInput } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatDate, cn } from "@/lib/utils";
import { Ad } from "@/types";

type AdStatus = "ativo" | "pausado" | "encerrado";

const tipoLabel: Record<string, string> = {
  destaque_home: "Destaque na Home",
  destaque_categoria: "Destaque na Categoria",
  destaque_cidade: "Destaque na Cidade",
  resultado_patrocinado: "Resultado Patrocinado",
  promocao_destacada: "Promoção Destacada",
};

const variant: Record<AdStatus, "success" | "warning" | "outline"> = {
  ativo: "success",
  pausado: "warning",
  encerrado: "outline",
};

type FiltroStatus = "todos" | AdStatus;

const FILTROS: { valor: FiltroStatus; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "ativo", label: "Ativos" },
  { valor: "pausado", label: "Pausados" },
  { valor: "encerrado", label: "Encerrados" },
];

export default function AnunciosPage() {
  const { token } = useAuth();
  const [anuncios, setAnuncios] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [termo, setTermo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/ads", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setAnuncios(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const results = useMemo(() => {
    return anuncios.filter((a) => {
      if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
      if (termo) {
        const alvo = `${a.companyNome} ${a.cidade} ${tipoLabel[a.tipo] ?? ""}`.toLowerCase();
        if (!alvo.includes(termo.toLowerCase())) return false;
      }
      return true;
    });
  }, [anuncios, termo, filtroStatus]);

  const alternarStatus = async (a: Ad) => {
    if (!token) return;
    const novoStatus: AdStatus = a.status === "ativo" ? "pausado" : "ativo";
    setProcessando(a.id);
    try {
      const res = await fetch(`/api/admin/ads/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setAnuncios((prev) => prev.map((x) => (x.id === a.id ? json.data : x)));
      } else {
        alert(json?.error?.message ?? "Não foi possível alterar o status.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const excluir = async (a: Ad) => {
    if (!token) return;
    if (!confirm(`Excluir o anúncio de "${a.companyNome}"? Não dá pra desfazer.`)) return;
    setProcessando(a.id);
    try {
      const res = await fetch(`/api/admin/ads/${a.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setAnuncios((prev) => prev.filter((x) => x.id !== a.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir esse anúncio.");
      }
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Anúncios</h1>
      <p className="text-sm text-ink-500">{results.length} de {anuncios.length} campanhas patrocinadas na plataforma.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SearchInput value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por empresa, cidade ou tipo..." containerClassName="max-w-xs" />
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
          <EmptyState title="Nenhum anúncio encontrado" description="Ajuste a busca ou o filtro de status acima." />
        ) : (
          <DataTable
            data={results}
            rowKey={(a) => a.id}
            columns={[
              { key: "empresa", header: "Empresa", render: (a) => <span className="font-medium text-ink-900">{a.companyNome}</span> },
              { key: "tipo", header: "Tipo", render: (a) => tipoLabel[a.tipo] },
              { key: "cidade", header: "Cidade", render: (a) => a.cidade },
              { key: "periodo", header: "Período", render: (a) => `${formatDate(a.inicio)} — ${formatDate(a.termino)}` },
              { key: "impressoes", header: "Impressões", render: (a) => a.impressoes.toLocaleString("pt-BR") },
              { key: "cliques", header: "Cliques", render: (a) => a.cliques.toLocaleString("pt-BR") },
              { key: "status", header: "Status", render: (a) => <Badge variant={variant[a.status]}>{a.status}</Badge> },
              {
                key: "acoes",
                header: "Ações",
                render: (a) => (
                  <div className="flex items-center gap-2">
                    {a.status !== "encerrado" && (
                      <button
                        type="button"
                        disabled={processando === a.id}
                        onClick={() => alternarStatus(a)}
                        className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
                        title={a.status === "ativo" ? "Pausar" : "Reativar"}
                      >
                        {a.status === "ativo" ? <Pause size={13} /> : <Play size={13} />} {a.status === "ativo" ? "Pausar" : "Ativar"}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={processando === a.id}
                      onClick={() => excluir(a)}
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
