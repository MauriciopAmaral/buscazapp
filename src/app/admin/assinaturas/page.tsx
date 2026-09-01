import { DataTable, Badge } from "@/components/ui";
import { subscriptions, planos } from "@/mocks/subscriptions";
import { companies } from "@/mocks/companies";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AssinaturasPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Assinaturas</h1>
      <p className="text-sm text-ink-500">{subscriptions.length} assinaturas registradas.</p>

      <div className="mt-4">
        <DataTable
          data={subscriptions}
          rowKey={(s) => s.id}
          columns={[
            { key: "empresa", header: "Empresa", render: (s) => companies.find((c) => c.id === s.companyId)?.nomeFantasia ?? "—" },
            { key: "plano", header: "Plano", render: (s) => planos.find((p) => p.id === s.planoId)?.nome },
            { key: "periodicidade", header: "Periodicidade", render: (s) => <span className="capitalize">{s.periodicidade}</span> },
            { key: "valor", header: "Valor", render: (s) => formatCurrency(s.valor) },
            { key: "proximaCobranca", header: "Próxima cobrança", render: (s) => formatDate(s.proximaCobranca) },
            { key: "status", header: "Status", render: (s) => <Badge variant={s.status === "ativa" ? "success" : s.status === "atrasada" ? "danger" : "outline"}>{s.status}</Badge> },
          ]}
        />
      </div>
    </div>
  );
}
