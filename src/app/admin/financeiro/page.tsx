import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { DataTable, Badge, MetricCard } from "@/components/ui";
import { payments, subscriptions } from "@/mocks/subscriptions";
import { companies } from "@/mocks/companies";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminFinanceiroPage() {
  const receita = payments.filter((p) => p.status === "pago").reduce((acc, p) => acc + p.valor, 0);
  const pendente = payments.filter((p) => p.status === "pendente").reduce((acc, p) => acc + p.valor, 0);
  const mrr = subscriptions.reduce((acc, s) => acc + s.valor, 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Financeiro</h1>
      <p className="text-sm text-ink-500">Visão consolidada da receita da plataforma.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Receita recebida" value={formatCurrency(receita)} icon={<DollarSign size={16} />} />
        <MetricCard label="MRR estimado" value={formatCurrency(mrr)} icon={<TrendingUp size={16} />} />
        <MetricCard label="Pagamentos pendentes" value={formatCurrency(pendente)} icon={<AlertCircle size={16} />} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Últimos pagamentos</h2>
        <DataTable
          data={payments.slice(0, 30)}
          rowKey={(p) => p.id}
          columns={[
            { key: "empresa", header: "Empresa", render: (p) => companies.find((c) => c.id === p.companyId)?.nomeFantasia ?? "—" },
            { key: "descricao", header: "Descrição", render: (p) => p.descricao },
            { key: "data", header: "Data", render: (p) => formatDate(p.data) },
            { key: "valor", header: "Valor", render: (p) => formatCurrency(p.valor) },
            { key: "status", header: "Status", render: (p) => <Badge variant={p.status === "pago" ? "success" : p.status === "pendente" ? "warning" : "danger"}>{p.status}</Badge> },
          ]}
        />
      </div>
    </div>
  );
}
