"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, Badge, LoadingState, EmptyState, Button, SearchInput, Select, Pagination } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

interface CidadeRow {
  id: string;
  nome: string;
  estado: string;
  totalBairros: number;
  totalEmpresas: number;
}

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function CidadesPage() {
  const { token } = useAuth();
  const [cidades, setCidades] = useState<CidadeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que filtros/página mudam
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (q) params.set("q", q);
    if (estado) params.set("estado", estado);
    fetch(`/api/admin/locations/cities?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) {
          setCidades(json.data.cidades);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token, q, estado, page]);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Cidades</h1>
      <p className="text-sm text-ink-500">{total} cidades cadastradas.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <SearchInput
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar cidade..."
          containerClassName="max-w-xs"
        />
        <Select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPage(1);
          }}
          containerClassName="min-w-[110px]"
        >
          <option value="">Todos os estados</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        {loading ? (
          <LoadingState />
        ) : cidades.length === 0 ? (
          <EmptyState
            title="Nenhuma cidade encontrada"
            description="Importe os municípios do Brasil (via IBGE) em Dados de referência."
            action={
              <Link href="/admin/dados-de-referencia">
                <Button>Ir pra Dados de referência</Button>
              </Link>
            }
          />
        ) : (
          <>
            <DataTable
              data={cidades}
              rowKey={(c) => c.id}
              columns={[
                { key: "nome", header: "Cidade", render: (c) => <span className="font-medium text-ink-900">{c.nome}</span> },
                { key: "estado", header: "Estado", render: (c) => <Badge variant="ink">{c.estado}</Badge> },
                { key: "bairros", header: "Bairros", render: (c) => c.totalBairros },
                { key: "empresas", header: "Empresas", render: (c) => c.totalEmpresas },
              ]}
            />
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
