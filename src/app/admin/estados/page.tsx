"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, LoadingState, EmptyState, Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

interface EstadoRow {
  sigla: string;
  totalCidades: number;
}

export default function EstadosPage() {
  const { token } = useAuth();
  const [estados, setEstados] = useState<EstadoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/locations/states", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setEstados(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Estados</h1>
      <p className="text-sm text-ink-500">Estados com cidades cadastradas na plataforma.</p>

      <div className="mt-4">
        {loading ? (
          <LoadingState />
        ) : estados.length === 0 ? (
          <EmptyState
            title="Nenhuma cidade cadastrada ainda"
            description="Importe os municípios do Brasil (via IBGE) em Dados de referência."
            action={
              <Link href="/admin/dados-de-referencia">
                <Button>Ir pra Dados de referência</Button>
              </Link>
            }
          />
        ) : (
          <DataTable
            data={estados}
            rowKey={(e) => e.sigla}
            columns={[
              { key: "sigla", header: "UF", render: (e) => <span className="font-medium text-ink-900">{e.sigla}</span> },
              { key: "cidades", header: "Cidades cadastradas", render: (e) => e.totalCidades },
            ]}
          />
        )}
      </div>
    </div>
  );
}
