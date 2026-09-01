import { DataTable } from "@/components/ui";
import { companies } from "@/mocks/companies";

const estados = [{ sigla: "PA", nome: "Pará" }];

export default function EstadosPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Estados</h1>
      <p className="text-sm text-ink-500">Estados com empresas cadastradas na plataforma.</p>

      <div className="mt-4">
        <DataTable
          data={estados}
          rowKey={(e) => e.sigla}
          columns={[
            { key: "sigla", header: "UF", render: (e) => <span className="font-medium text-ink-900">{e.sigla}</span> },
            { key: "nome", header: "Estado", render: (e) => e.nome },
            { key: "empresas", header: "Empresas", render: (e) => companies.filter((c) => c.endereco.estado === e.sigla).length },
          ]}
        />
      </div>
    </div>
  );
}
