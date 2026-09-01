"use client";

import { useState } from "react";
import { Eye, Pencil, ShieldCheck, Target } from "lucide-react";
import { DataTable, Badge } from "@/components/ui";
import { companies } from "@/mocks/companies";
import Link from "next/link";

export default function EmpresasNaoReivindicadasPage() {
  const [items, setItems] = useState(companies.filter((c) => !c.reivindicada));

  const marcarVerificada = (id: string) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, verificado: true } : c)));
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Empresas não reivindicadas</h1>
      <p className="text-sm text-ink-500">{items.length} empresas ainda sem administração ativa.</p>

      <div className="mt-4">
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
            { key: "status", header: "Status", render: (c) => <Badge variant={c.verificado ? "brand" : "outline"}>{c.verificado ? "Verificada" : "Não verificada"}</Badge> },
            {
              key: "acoes",
              header: "Ações",
              render: (c) => (
                <div className="flex items-center gap-2">
                  <Link href={`/empresa/${c.slug}`} target="_blank" className="text-ink-500 hover:text-brand-700" title="Visualizar">
                    <Eye size={15} />
                  </Link>
                  <button className="text-ink-500 hover:text-brand-700" title="Editar">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => marcarVerificada(c.id)} className="text-ink-500 hover:text-brand-700" title="Marcar como verificada">
                    <ShieldCheck size={15} />
                  </button>
                  <button className="text-ink-500 hover:text-brand-700" title="Iniciar prospecção">
                    <Target size={15} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
