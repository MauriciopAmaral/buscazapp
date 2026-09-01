import { DataTable } from "@/components/ui";
import { neighborhoods, cities } from "@/mocks/locations";

export default function BairrosPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Bairros</h1>
      <p className="text-sm text-ink-500">{neighborhoods.length} bairros cadastrados.</p>

      <div className="mt-4">
        <DataTable
          data={neighborhoods}
          rowKey={(b) => b.id}
          columns={[
            { key: "nome", header: "Bairro", render: (b) => <span className="font-medium text-ink-900">{b.nome}</span> },
            { key: "cidade", header: "Cidade", render: (b) => cities.find((c) => c.id === b.cidadeId)?.nome ?? "—" },
          ]}
        />
      </div>
    </div>
  );
}
