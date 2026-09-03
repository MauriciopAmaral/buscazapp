"use client";

import { useEffect, useMemo, useState } from "react";
import { Phone, Plus, Trash2 } from "lucide-react";
import { Button, Modal, SearchInput, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { Company, Prospect, ProspectStatus } from "@/types";
import { cn } from "@/lib/utils";

const columns: { key: ProspectStatus; label: string; color: string }[] = [
  { key: "novo", label: "Novo", color: "bg-ink-400" },
  { key: "contatado", label: "Contatado", color: "bg-blue-400" },
  { key: "interessado", label: "Interessado", color: "bg-amber-400" },
  { key: "reivindicado", label: "Reivindicado", color: "bg-purple-400" },
  { key: "assinante", label: "Assinante", color: "bg-brand-500" },
  { key: "nao_interessado", label: "Não interessado", color: "bg-red-400" },
];

export default function ProspeccaoPage() {
  const { token } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [empresas, setEmpresas] = useState<Company[]>([]);
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(false);
  const [buscaEmpresa, setBuscaEmpresa] = useState("");
  const [adicionando, setAdicionando] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/prospects", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setProspects(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const abrirModal = () => {
    setBuscaEmpresa("");
    setModalAberto(true);
    if (empresas.length === 0 && token) {
      setCarregandoEmpresas(true);
      fetch("/api/admin/companies", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => {
          if (json?.success) setEmpresas(json.data);
        })
        .catch(() => undefined)
        .finally(() => setCarregandoEmpresas(false));
    }
  };

  const empresasProspectaveis = useMemo(() => {
    const jaNoFunil = new Set(prospects.map((p) => p.companyId));
    return empresas
      .filter((e) => !jaNoFunil.has(e.id))
      .filter((e) => {
        if (!buscaEmpresa) return true;
        const alvo = `${e.nomeFantasia} ${e.endereco.cidade}`.toLowerCase();
        return alvo.includes(buscaEmpresa.toLowerCase());
      })
      .slice(0, 30);
  }, [empresas, prospects, buscaEmpresa]);

  const adicionarProspeccao = async (empresa: Company) => {
    if (!token) return;
    setAdicionando(empresa.id);
    try {
      const res = await fetch("/api/admin/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId: empresa.id }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setProspects((prev) => [json.data, ...prev]);
        setModalAberto(false);
      } else {
        alert(json?.error?.message ?? "Não foi possível adicionar essa empresa ao funil.");
      }
    } finally {
      setAdicionando(null);
    }
  };

  const mudarStatus = async (id: string, status: ProspectStatus) => {
    if (!token) return;
    setProcessando(id);
    try {
      const res = await fetch(`/api/admin/prospects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setProspects((prev) => prev.map((p) => (p.id === id ? json.data : p)));
      } else {
        alert(json?.error?.message ?? "Não foi possível atualizar o status.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const advance = (p: Prospect) => {
    const idx = columns.findIndex((c) => c.key === p.status);
    const next = columns[Math.min(idx + 1, columns.length - 2)];
    mudarStatus(p.id, next.key);
  };

  const excluir = async (p: Prospect) => {
    if (!token) return;
    if (!confirm(`Remover "${p.companyNome}" do funil de prospecção?`)) return;
    setProcessando(p.id);
    try {
      const res = await fetch(`/api/admin/prospects/${p.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setProspects((prev) => prev.filter((x) => x.id !== p.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível remover esse card.");
      }
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Prospecção</h1>
          <p className="text-sm text-ink-500">CRM simples para acompanhar a captação de novas empresas.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={abrirModal}>
          Adicionar empresa
        </Button>
      </div>

      {loading ? (
        <div className="mt-6">
          <LoadingState rows={3} />
        </div>
      ) : (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const items = prospects.filter((p) => p.status === col.key);
            return (
              <div key={col.key} className="w-64 shrink-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", col.color)} />
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {col.label} ({items.length})
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((p) => (
                    <div key={p.id} className="rounded-xl border border-ink-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-ink-900">{p.companyNome}</p>
                        <button
                          type="button"
                          disabled={processando === p.id}
                          onClick={() => excluir(p)}
                          className="shrink-0 text-ink-300 hover:text-red-600 disabled:opacity-50"
                          title="Remover do funil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p className="text-xs text-ink-500">{p.cidade}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                        <Phone size={11} /> {p.telefone}
                      </p>
                      {col.key !== "assinante" && col.key !== "nao_interessado" && (
                        <button
                          type="button"
                          disabled={processando === p.id}
                          onClick={() => advance(p)}
                          className="mt-2 w-full rounded-lg bg-ink-100 py-1.5 text-xs font-medium text-ink-700 hover:bg-brand-100 hover:text-brand-700 disabled:opacity-50"
                        >
                          Avançar etapa
                        </button>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-xs text-ink-300">
                      Vazio
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Adicionar empresa ao funil">
        <div className="flex flex-col gap-3">
          <SearchInput
            value={buscaEmpresa}
            onChange={(e) => setBuscaEmpresa(e.target.value)}
            placeholder="Buscar por nome da empresa ou cidade..."
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto rounded-xl border border-ink-200">
            {carregandoEmpresas ? (
              <p className="px-3 py-4 text-center text-sm text-ink-400">Carregando empresas...</p>
            ) : empresasProspectaveis.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-ink-400">
                Nenhuma empresa disponível — ou já está no funil, ou não bate com a busca.
              </p>
            ) : (
              empresasProspectaveis.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  disabled={adicionando === e.id}
                  onClick={() => adicionarProspeccao(e)}
                  className="flex w-full items-center justify-between border-b border-ink-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-ink-50 disabled:opacity-50"
                >
                  <span>
                    <span className="font-medium text-ink-900">{e.nomeFantasia}</span>{" "}
                    <span className="text-xs text-ink-400">— {e.endereco.cidade}</span>
                  </span>
                  <Plus size={14} className="text-brand-600" />
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
