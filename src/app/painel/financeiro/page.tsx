import { CreditCard, Calendar } from "lucide-react";
import { DataTable, Badge } from "@/components/ui";
import { companies } from "@/mocks/companies";
import { getSubscriptionByCompany, getPaymentsByCompany, planos } from "@/mocks/subscriptions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function FinanceiroPage() {
  // Empresa padrão do protótipo (a mesma usada em useCurrentCompany no server não é possível; usamos a primeira reivindicada)
  const company = companies.find((c) => c.reivindicada) ?? companies[0];
  const subscription = getSubscriptionByCompany(company.id);
  const payments = getPaymentsByCompany(company.id);
  const plano = planos.find((p) => p.id === company.planoId);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Financeiro</h1>
      <p className="text-sm text-ink-500">Acompanhe cobranças e o histórico de pagamentos.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <CreditCard size={16} className="text-ink-400" /> Plano atual
          </div>
          <p className="mt-2 text-lg font-bold text-ink-900">{plano?.nome}</p>
          <p className="text-sm text-ink-500">{formatCurrency(subscription?.valor ?? 0)} / {subscription?.periodicidade}</p>
          <Badge variant={subscription?.status === "atrasada" ? "danger" : "success"} className="mt-2">
            {subscription?.status ?? "ativa"}
          </Badge>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <Calendar size={16} className="text-ink-400" /> Próxima cobrança
          </div>
          <p className="mt-2 text-lg font-bold text-ink-900">
            {subscription ? formatDate(subscription.proximaCobranca) : "—"}
          </p>
          <p className="text-sm text-ink-500">Cartão terminado em •••• 4242 (simulado)</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Histórico de pagamentos</h2>
        <DataTable
          data={payments}
          rowKey={(p) => p.id}
          emptyTitle="Nenhum pagamento registrado"
          columns={[
            { key: "data", header: "Data", render: (p) => formatDate(p.data) },
            { key: "descricao", header: "Descrição", render: (p) => p.descricao },
            { key: "valor", header: "Valor", render: (p) => formatCurrency(p.valor) },
            {
              key: "status",
              header: "Status",
              render: (p) => (
                <Badge variant={p.status === "pago" ? "success" : p.status === "pendente" ? "warning" : "danger"}>
                  {p.status}
                </Badge>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
