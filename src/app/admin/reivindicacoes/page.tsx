"use client";

import { useState } from "react";
import { Eye, Check, X } from "lucide-react";
import { DataTable, Badge } from "@/components/ui";
import { claims as claimsMock } from "@/mocks/claims";
import { formatDate } from "@/lib/utils";
import { ClaimStatus } from "@/types";

const statusVariant: Record<ClaimStatus, "outline" | "warning" | "brand" | "success" | "danger"> = {
  novo: "outline",
  aguardando_validacao: "warning",
  em_analise: "brand",
  aprovado: "success",
  rejeitado: "danger",
};

const statusLabel: Record<ClaimStatus, string> = {
  novo: "Novo",
  aguardando_validacao: "Aguardando validação",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export default function ReivindicacoesPage() {
  const [claims, setClaims] = useState(claimsMock);

  const updateStatus = (id: string, status: ClaimStatus) => {
    setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Reivindicações</h1>
      <p className="text-sm text-ink-500">Aprove ou rejeite solicitações de administração de perfis.</p>

      <div className="mt-4">
        <DataTable
          data={claims}
          rowKey={(c) => c.id}
          emptyTitle="Nenhuma reivindicação registrada"
          columns={[
            { key: "empresa", header: "Empresa", render: (c) => <span className="font-medium text-ink-900">{c.companyNome}</span> },
            { key: "usuario", header: "Usuário", render: (c) => c.usuario },
            { key: "metodo", header: "Método", render: (c) => <span className="capitalize">{c.metodo}</span> },
            { key: "data", header: "Data", render: (c) => formatDate(c.data) },
            { key: "status", header: "Status", render: (c) => <Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge> },
            {
              key: "acoes",
              header: "Ações",
              render: (c) => (
                <div className="flex items-center gap-2">
                  <button className="text-ink-500 hover:text-brand-700" title="Visualizar">
                    <Eye size={15} />
                  </button>
                  <button onClick={() => updateStatus(c.id, "aprovado")} className="text-ink-500 hover:text-emerald-600" title="Aprovar">
                    <Check size={15} />
                  </button>
                  <button onClick={() => updateStatus(c.id, "rejeitado")} className="text-ink-500 hover:text-red-600" title="Rejeitar">
                    <X size={15} />
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
