"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { DataTable, LoadingState, EmptyState, Button, Select, SearchInput, Modal, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

interface CidadeOption {
  id: string;
  nome: string;
  estado: string;
  totalBairros: number;
}

interface BairroRow {
  id: string;
  nome: string;
}

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function BairrosPage() {
  const { token } = useAuth();

  const [estado, setEstado] = useState("PA");
  const [buscaCidade, setBuscaCidade] = useState("");
  const [cidadesEncontradas, setCidadesEncontradas] = useState<CidadeOption[]>([]);
  const [buscandoCidades, setBuscandoCidades] = useState(false);
  const [cidadeSelecionada, setCidadeSelecionada] = useState<CidadeOption | null>(null);

  const [bairros, setBairros] = useState<BairroRow[]>([]);
  const [loadingBairros, setLoadingBairros] = useState(false);
  const [termoBairro, setTermoBairro] = useState("");
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [novoBairroNome, setNovoBairroNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Busca cidades do estado escolhido (com filtro por nome opcional), com
  // debounce — os estados maiores (SP, MG...) têm mais cidades do que a
  // API devolve numa página só, então uma busca por nome funciona melhor
  // que listar tudo num <select>.
  useEffect(() => {
    if (!token) return;
    const timeout = setTimeout(() => {
      setBuscandoCidades(true);
      const params = new URLSearchParams({ estado, pageSize: "30" });
      if (buscaCidade) params.set("q", buscaCidade);
      fetch(`/api/admin/locations/cities?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => {
          if (json?.success) setCidadesEncontradas(json.data.cidades);
        })
        .catch(() => undefined)
        .finally(() => setBuscandoCidades(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [token, estado, buscaCidade]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- limpa a cidade/bairros selecionados assim que o estado muda
    setCidadeSelecionada(null);
    setBairros([]);
  }, [estado]);

  const carregarBairros = (cidade: CidadeOption) => {
    if (!token) return;
    setLoadingBairros(true);
    fetch(`/api/admin/locations/neighborhoods?cidadeId=${cidade.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setBairros(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoadingBairros(false));
  };

  const selecionarCidade = (cidade: CidadeOption) => {
    setCidadeSelecionada(cidade);
    setBuscaCidade("");
    carregarBairros(cidade);
  };

  const bairrosFiltrados = useMemo(() => {
    if (!termoBairro) return bairros;
    return bairros.filter((b) => b.nome.toLowerCase().includes(termoBairro.toLowerCase()));
  }, [bairros, termoBairro]);

  const abrirCadastro = () => {
    setNovoBairroNome("");
    setErroModal(null);
    setModalAberto(true);
  };

  const cadastrarBairro = async () => {
    if (!token || !cidadeSelecionada) return;
    const nome = novoBairroNome.trim();
    if (!nome) {
      setErroModal("Digite o nome do bairro.");
      return;
    }
    setSalvando(true);
    setErroModal(null);
    try {
      const res = await fetch("/api/admin/locations/neighborhoods", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cidadeId: cidadeSelecionada.id, nome }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErroModal(json?.error?.message ?? "Não foi possível cadastrar o bairro.");
        return;
      }
      setBairros((prev) => [...prev, json.data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setCidadeSelecionada((prev) => (prev ? { ...prev, totalBairros: prev.totalBairros + 1 } : prev));
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  const excluirBairro = async (bairro: BairroRow) => {
    if (!token) return;
    if (!confirm(`Excluir o bairro "${bairro.nome}"?`)) return;
    setExcluindo(bairro.id);
    try {
      const res = await fetch(`/api/admin/locations/neighborhoods/${bairro.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setBairros((prev) => prev.filter((b) => b.id !== bairro.id));
        setCidadeSelecionada((prev) => (prev ? { ...prev, totalBairros: Math.max(0, prev.totalBairros - 1) } : prev));
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir esse bairro.");
      }
    } finally {
      setExcluindo(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Bairros</h1>
          <p className="text-sm text-ink-500">Escolha o estado e a cidade pra ver ou cadastrar os bairros dela.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={abrirCadastro} disabled={!cidadeSelecionada}>
          Cadastrar bairro
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Select label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} containerClassName="min-w-[110px]">
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </Select>
        <div className="relative min-w-[260px]">
          <SearchInput
            value={cidadeSelecionada ? `${cidadeSelecionada.nome} — ${cidadeSelecionada.estado}` : buscaCidade}
            onChange={(e) => {
              setCidadeSelecionada(null);
              setBairros([]);
              setBuscaCidade(e.target.value);
            }}
            onFocus={() => {
              if (cidadeSelecionada) {
                setCidadeSelecionada(null);
                setBairros([]);
              }
            }}
            placeholder="Buscar cidade..."
          />
          {!cidadeSelecionada && (buscaCidade || cidadesEncontradas.length > 0) && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-ink-200 bg-white shadow-lg">
              {buscandoCidades ? (
                <p className="px-3 py-2 text-sm text-ink-400">Buscando...</p>
              ) : cidadesEncontradas.length === 0 ? (
                <p className="px-3 py-2 text-sm text-ink-400">Nenhuma cidade encontrada.</p>
              ) : (
                cidadesEncontradas.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selecionarCidade(c)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-50"
                  >
                    <span>{c.nome}</span>
                    <span className="text-xs text-ink-400">{c.totalBairros} bairro(s)</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {!cidadeSelecionada ? (
        <div className="mt-6">
          <EmptyState
            title="Escolha uma cidade"
            description="Selecione o estado e busque a cidade acima pra ver os bairros cadastrados nela."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              {bairros.length} bairro(s) cadastrados em <span className="font-medium text-ink-900">{cidadeSelecionada.nome} — {cidadeSelecionada.estado}</span>.
            </p>
            <SearchInput
              value={termoBairro}
              onChange={(e) => setTermoBairro(e.target.value)}
              placeholder="Buscar bairro..."
              containerClassName="max-w-xs"
            />
          </div>

          <div className="mt-4">
            {loadingBairros ? (
              <LoadingState />
            ) : bairros.length === 0 ? (
              <EmptyState
                title="Nenhum bairro cadastrado ainda pra essa cidade"
                description="Clique em “Cadastrar bairro” acima pra adicionar o primeiro."
                action={
                  <Link href="/admin/dados-de-referencia">
                    <Button variant="outline">Ou importe em massa em Dados de referência</Button>
                  </Link>
                }
              />
            ) : (
              <DataTable
                data={bairrosFiltrados}
                rowKey={(b) => b.id}
                columns={[
                  { key: "nome", header: "Bairro", render: (b) => <span className="font-medium text-ink-900">{b.nome}</span> },
                  {
                    key: "acoes",
                    header: "Ações",
                    render: (b) => (
                      <button
                        type="button"
                        disabled={excluindo === b.id}
                        onClick={() => excluirBairro(b)}
                        className="text-ink-500 hover:text-red-600 disabled:opacity-40"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    ),
                  },
                ]}
              />
            )}
          </div>
        </>
      )}

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title={`Cadastrar bairro em ${cidadeSelecionada?.nome ?? ""}`}>
        <div className="flex flex-col gap-4">
          <Input
            label="Nome do bairro"
            value={novoBairroNome}
            onChange={(e) => setNovoBairroNome(e.target.value)}
            placeholder="Ex: Centro"
            autoFocus
          />
          {erroModal && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {erroModal}
            </p>
          )}
          <Button onClick={cadastrarBairro} disabled={salvando} fullWidth>
            {salvando ? "Salvando..." : "Salvar bairro"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
