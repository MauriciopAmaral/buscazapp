"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, ShieldCheck, Target } from "lucide-react";
import { DataTable, Badge, LoadingState, EmptyState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import type { Company } from "@/types";

export default function EmpresasNaoReivindicadasPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [prospectadas, setProspectadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/companies", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.success) setItems((json.data as Company[]).filter((c) => !c.reivindicada));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const alternarVerificada = async (empresa: Company) => {
    if (!token) return;
    setProcessando(empresa.id);
    try {
      const res = await fetch(`/api/admin/companies/${empresa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ verificado: !empresa.verificado }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setItems((prev) => prev.map((c) => (c.id === empresa.id ? { ...c, verificado: !c.verificado } : c)));
      } else {
        alert(json?.error?.message ?? "Não foi possível atualizar a verificação.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const iniciarProspeccao = async (empresa: Company) => {
    if (!token) return;
    setProcessando(empresa.id);
    try {
      const res = await fetch("/api/admin/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId: empresa.id }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setProspectadas((prev) => new Set(prev).add(empresa.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível iniciar a prospecção.");
      }
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Empresas não reivindicadas</h1>
      <p className="text-sm text-ink-500">{items.length} empresas ainda sem administração ativa.</p>

      <div className="mt-4">
        {loading ? (
          <LoadingState rows={3} />
        ) : items.length === 0 ? (
          <EmptyState title="Todas as empresas já foram reivindicadas" description="Nenhuma empresa cadastrada está sem dono no momento." />
        ) : (
          <DataTable
            data={items}
            rowKey={(c) => c.id}
            emptyTitle="Todas as empresas já foram reivindicadas"
            columns={[
              { key: "empresa", header: "Empresa", render: (c) => <span className="font-medium text-ink-900">{c.nomeFantasia}</span> },
              { key: "cnpj", header: "CNPJ", render: (c) => <span className="text-xs">{c.cnpj}</span> },
              { key: "cidade", header: "Cidade", render: (c) => c.endereco.cidade },
              { key: "categoria", header: "Categoria", render: (c) => c.categoriaNome },
              { key: "telefone", header: "Telefone", render: (c) => c.telefone },
              {
                key: "status",
                header: "Status",
                render: (c) => <Badge variant={c.verificado ? "brand" : "outline"}>{c.verificado ? "Verificada" : "Não verificada"}</Badge>,
              },
              {
                key: "acoes",
                header: "Ações",
                render: (c) => (
                  <div className="flex items-center gap-2">
                    <Link href={`/empresa/${c.slug}`} target="_blank" className="text-ink-500 hover:text-brand-700" title="Visualizar">
                      <Eye size={15} />
                    </Link>
                    <Link href={`/admin/empresas/${c.id}`} className="text-ink-500 hover:text-brand-700" title="Editar">
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      disabled={processando === c.id}
                      onClick={() => alternarVerificada(c)}
                      className={`disabled:opacity-40 ${c.verificado ? "text-brand-600" : "text-ink-500 hover:text-brand-700"}`}
                      title={c.verificado ? "Remover verificação" : "Marcar como verificada"}
                    >
                      <ShieldCheck size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={processando === c.id || prospectadas.has(c.id)}
                      onClick={() => iniciarProspeccao(c)}
                      className={`disabled:opacity-40 ${prospectadas.has(c.id) ? "text-brand-600" : "text-ink-500 hover:text-brand-700"}`}
                      title={prospectadas.has(c.id) ? "Já está no funil de prospecção" : "Iniciar prospecção"}
                    >
                      <Target size={15} />
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
