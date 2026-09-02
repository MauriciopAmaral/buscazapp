"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, LoadingState, EmptyState, Button, Select } from "@/components/ui";
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

export default function BairrosPage() {
  const { token } = useAuth();
  const [cidades, setCidades] = useState<CidadeOption[]>([]);
  const [cidadeId, setCidadeId] = useState("");
  const [bairros, setBairros] = useState<BairroRow[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(true);
  const [loadingBairros, setLoadingBairros] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/locations/cities?pageSize=200", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) {
          const comBairros: CidadeOption[] = json.data.cidades.filter((c: CidadeOption) => c.totalBairros > 0);
          setCidades(comBairros);
          if (comBairros.length > 0) setCidadeId(comBairros[0].id);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingCidades(false));
  }, [token]);

  useEffect(() => {
    if (!token || !cidadeId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que a cidade selecionada muda
    setLoadingBairros(true);
    fetch(`/api/admin/locations/neighborhoods?cidadeId=${cidadeId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setBairros(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoadingBairros(false));
  }, [token, cidadeId]);

  if (loadingCidades) {
    return (
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Bairros</h1>
        <div className="mt-4">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (cidades.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Bairros</h1>
        <div className="mt-4">
          <EmptyState
            title="Nenhuma cidade com bairros cadastrados ainda"
            description="Importe os bairros de Belém, Castanhal e Ananindeua em Dados de referência."
            action={
              <Link href="/admin/dados-de-referencia">
                <Button>Ir pra Dados de referência</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Bairros</h1>
      <p className="text-sm text-ink-500">{bairros.length} bairros cadastrados nesta cidade.</p>

      <div className="mt-4 max-w-xs">
        <Select value={cidadeId} onChange={(e) => setCidadeId(e.target.value)}>
          {cidades.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} — {c.estado} ({c.totalBairros})
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        {loadingBairros ? (
          <LoadingState />
        ) : (
          <DataTable
            data={bairros}
            rowKey={(b) => b.id}
            columns={[{ key: "nome", header: "Bairro", render: (b) => <span className="font-medium text-ink-900">{b.nome}</span> }]}
          />
        )}
      </div>
    </div>
  );
}
