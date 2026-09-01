import { DataTable, Badge } from "@/components/ui";
import { promotions } from "@/mocks/promotions";
import { companies } from "@/mocks/companies";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PromotionStatus } from "@/types";

const variant: Record<PromotionStatus, "success" | "warning" | "outline" | "danger"> = {
  ativa: "success",
  agendada: "warning",
  expirada: "outline",
  desativada: "danger",
};

export default function AdminPromocoesPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Promoções</h1>
      <p className="text-sm text-ink-500">{promotions.length} promoções cadastradas na plataforma.</p>

      <div className="mt-4">
        <DataTable
          data={promotions}
          rowKey={(p) => p.id}
          columns={[
            { key: "titulo", header: "Promoção", render: (p) => <span className="font-medium text-ink-900">{p.titulo}</span> },
            { key: "empresa", header: "Empresa", render: (p) => companies.find((c) => c.id === p.companyId)?.nomeFantasia ?? "—" },
            { key: "preco", header: "Preço", render: (p) => `${formatCurrency(p.preco)} → ${formatCurrency(p.precoPromocional)}` },
            { key: "termino", header: "Até", render: (p) => formatDate(p.termino) },
            { key: "status", header: "Status", render: (p) => <Badge variant={variant[p.status]}>{p.status}</Badge> },
          ]}
        />
      </div>
    </div>
  );
}
