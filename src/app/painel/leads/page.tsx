"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone, Ticket, Globe } from "lucide-react";
import { DataTable, Badge, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCurrentCompanyLive } from "@/lib/useCurrentCompany";
import { formatDateTime } from "@/lib/utils";
import { Lead, LeadOrigem } from "@/types";

const origemInfo: Record<LeadOrigem, { label: string; icon: React.ReactNode }> = {
  whatsapp: { label: "WhatsApp", icon: <MessageCircle size={13} /> },
  telefone: { label: "Telefone", icon: <Phone size={13} /> },
  cupom: { label: "Cupom", icon: <Ticket size={13} /> },
  site: { label: "Site", icon: <Globe size={13} /> },
};

export default function LeadsPage() {
  const { token } = useAuth();
  const { company } = useCurrentCompanyLive();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/painel/leads", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json?.success) setLeads(json.data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Leads</h1>
      <p className="text-sm text-ink-500">Contatos gerados pelo seu perfil no BuscaZapp.</p>

      <div className="mt-6">
        {loading ? (
          <LoadingState rows={2} />
        ) : (
          <DataTable
            data={leads}
            rowKey={(l) => l.id}
            emptyTitle="Nenhum lead recebido ainda"
            columns={[
              { key: "data", header: "Data", render: (l) => formatDateTime(l.data) },
              {
                key: "origem",
                header: "Origem",
                render: (l) => (
                  <Badge variant="brand" icon={origemInfo[l.origem].icon}>
                    {origemInfo[l.origem].label}
                  </Badge>
                ),
              },
              { key: "tipo", header: "Tipo", render: (l) => l.tipo },
              { key: "empresa", header: "Empresa", render: () => company?.nomeFantasia ?? "" },
              { key: "acao", header: "Ação", render: (l) => l.acao },
            ]}
          />
        )}
      </div>
    </div>
  );
}
