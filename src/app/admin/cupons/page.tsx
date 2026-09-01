import { DataTable, Badge } from "@/components/ui";
import { coupons } from "@/mocks/coupons";
import { companies } from "@/mocks/companies";
import { formatDate } from "@/lib/utils";
import { CouponStatus } from "@/types";

const variant: Record<CouponStatus, "success" | "outline" | "ink" | "danger"> = {
  ativo: "success",
  expirado: "outline",
  utilizado: "ink",
  desativado: "danger",
};

export default function AdminCuponsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Cupons</h1>
      <p className="text-sm text-ink-500">{coupons.length} cupons cadastrados na plataforma.</p>

      <div className="mt-4">
        <DataTable
          data={coupons}
          rowKey={(c) => c.id}
          columns={[
            { key: "titulo", header: "Cupom", render: (c) => <span className="font-medium text-ink-900">{c.titulo}</span> },
            { key: "empresa", header: "Empresa", render: (c) => companies.find((e) => e.id === c.companyId)?.nomeFantasia ?? "—" },
            { key: "codigo", header: "Código", render: (c) => <code className="text-xs">{c.codigo}</code> },
            { key: "uso", header: "Uso", render: (c) => `${c.utilizados}/${c.limite}` },
            { key: "validade", header: "Validade", render: (c) => formatDate(c.validade) },
            { key: "status", header: "Status", render: (c) => <Badge variant={variant[c.status]}>{c.status}</Badge> },
          ]}
        />
      </div>
    </div>
  );
}
