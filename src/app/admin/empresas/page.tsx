"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Eye, CheckCircle2, XCircle, Pencil, Power, Trash2 } from "lucide-react";
import { DataTable, Badge, FilterBar, Select, SearchInput, LoadingState } from "@/components/ui";
import { planos } from "@/mocks/subscriptions";
import { useAuth } from "@/context/AuthContext";
import { Category, Company } from "@/types";
import { normalizeForCompare } from "@/lib/utils";
import Link from "next/link";

export default function AdminEmpresasPage() {
  const { token } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [termo, setTermo] = useState("");
  const [cidade, setCidade] = useState("");
  const [categoria, setCategoria] = useState("");
  const [plano, setPlano] = useState("");
  const [reivindicada, setReivindicada] = useState("");
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/companies", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([companiesJson, categoriesJson]) => {
        if (cancelled) return;
        if (companiesJson?.success) setCompanies(companiesJson.data);
        if (categoriesJson?.success) setCategories(categoriesJson.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const cidadesPara = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const c of companies) {
      const chave = normalizeForCompare(c.endereco.cidade);
      if (chave && !vistos.has(chave)) vistos.set(chave, c.endereco.cidade);
    }
    return Array.from(vistos.values()).sort();
  }, [companies]);

  const alternarStatus = async (empresa: Company) => {
    if (!token) return;
    const novoStatus = empresa.status === "ativo" ? "suspenso" : "ativo";
    const acaoLabel = novoStatus === "ativo" ? "ativar" : "desativar";
    if (!confirm(`Quer mesmo ${acaoLabel} "${empresa.nomeFantasia}"?`)) return;
    setProcessando(empresa.id);
    try {
      const res = await fetch(`/api/admin/companies/${empresa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setCompanies((prev) => prev.map((c) => (c.id === empresa.id ? { ...c, status: novoStatus } : c)));
      } else {
        alert(json?.error?.message ?? "Não foi possível alterar o status.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const excluirEmpresa = async (empresa: Company) => {
    if (!token) return;
    if (!confirm(`Excluir "${empresa.nomeFantasia}" definitivamente? Isso apaga também produtos, cupons, avaliações e todo o resto ligado a ela. Não dá pra desfazer.`)) return;
    setProcessando(empresa.id);
    try {
      const res = await fetch(`/api/admin/companies/${empresa.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setCompanies((prev) => prev.filter((c) => c.id !== empresa.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir a empresa.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const results = useMemo(() => {
    return companies.filter((c) => {
      if (termo && !c.nomeFantasia.toLowerCase().includes(termo.toLowerCase())) return false;
      if (cidade && normalizeForCompare(c.endereco.cidade) !== normalizeForCompare(cidade)) return false;
      if (categoria && c.categoriaId !== categoria) return false;
      if (plano && c.planoId !== plano) return false;
      if (reivindicada === "sim" && !c.reivindicada) return false;
      if (reivindicada === "nao" && c.reivindicada) return false;
      return true;
    });
  }, [companies, termo, cidade, categoria, plano, reivindicada]);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Empresas</h1>
      <p className="text-sm text-ink-500">{results.length} de {companies.length} empresas cadastradas.</p>

      <div className="mt-4">
        <SearchInput value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por nome..." />
      </div>

      <FilterBar className="mt-4">
        <Select label="Estado" defaultValue="PA" containerClassName="min-w-[110px]">
          <option value="PA">PA</option>
        </Select>
        <Select label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} containerClassName="min-w-[150px]">
          <option value="">Todas</option>
          {cidadesPara.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} containerClassName="min-w-[170px]">
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </Select>
        <Select label="Plano" value={plano} onChange={(e) => setPlano(e.target.value)} containerClassName="min-w-[140px]">
          <option value="">Todos</option>
          {planos.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </Select>
        <Select label="Reivindicada" value={reivindicada} onChange={(e) => setReivindicada(e.target.value)} containerClassName="min-w-[140px]">
          <option value="">Todas</option>
          <option value="sim">Sim</option>
          <option value="nao">Não</option>
        </Select>
      </FilterBar>

      <div className="mt-4">
        {loading ? <LoadingState rows={2} /> : (
        <DataTable
          data={results}
          rowKey={(c) => c.id}
          emptyTitle="Nenhuma empresa encontrada"
          columns={[
            {
              key: "empresa",
              header: "Empresa",
              render: (c) => (
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    <Image src={c.logoUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <span className="font-medium text-ink-900">{c.nomeFantasia}</span>
                </div>
              ),
            },
            { key: "cnpj", header: "CNPJ", render: (c) => <span className="text-xs">{c.cnpj}</span> },
            { key: "cidade", header: "Cidade", render: (c) => c.endereco.cidade },
            { key: "categoria", header: "Categoria", render: (c) => c.categoriaNome },
            {
              key: "reivindicada",
              header: "Reivindicada",
              render: (c) => (c.reivindicada ? <CheckCircle2 size={16} className="text-brand-600" /> : <XCircle size={16} className="text-ink-300" />),
            },
            {
              key: "verificada",
              header: "Verificada",
              render: (c) => (c.verificado ? <CheckCircle2 size={16} className="text-brand-600" /> : <XCircle size={16} className="text-ink-300" />),
            },
            { key: "plano", header: "Plano", render: (c) => <Badge variant={c.premium ? "gold" : "ink"}>{planos.find((p) => p.id === c.planoId)?.nome}</Badge> },
            { key: "status", header: "Status", render: (c) => <Badge variant={c.status === "ativo" ? "success" : "warning"}>{c.status}</Badge> },
            {
              key: "acoes",
              header: "Ações",
              render: (c) => (
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/empresa/${c.slug}`} target="_blank" className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                    <Eye size={13} /> Ver
                  </Link>
                  <Link href={`/admin/empresas/${c.id}`} className="flex items-center gap-1 text-xs font-medium text-ink-700 hover:underline">
                    <Pencil size={13} /> Editar
                  </Link>
                  <button
                    type="button"
                    disabled={processando === c.id}
                    onClick={() => alternarStatus(c)}
                    className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
                  >
                    <Power size={13} /> {c.status === "ativo" ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    disabled={processando === c.id}
                    onClick={() => excluirEmpresa(c)}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
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
