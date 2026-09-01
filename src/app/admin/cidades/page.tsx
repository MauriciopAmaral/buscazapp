import { DataTable, Badge } from "@/components/ui";
import { cities } from "@/mocks/locations";

export default function CidadesPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Cidades</h1>
      <p className="text-sm text-ink-500">Cidades atendidas pelo BuscaZapp.</p>

      <div className="mt-4">
        <DataTable
          data={cities}
          rowKey={(c) => c.id}
          columns={[
            { key: "nome", header: "Cidade", render: (c) => <span className="font-medium text-ink-900">{c.nome}</span> },
            { key: "estado", header: "Estado", render: (c) => <Badge variant="ink">{c.estado}</Badge> },
            { key: "empresas", header: "Empresas", render: (c) => c.totalEmpresas },
          ]}
        />
      </div>
    </div>
  );
}
