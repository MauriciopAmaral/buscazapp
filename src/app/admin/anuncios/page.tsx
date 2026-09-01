import { DataTable, Badge } from "@/components/ui";
import { ads } from "@/mocks/claims";
import { formatDate } from "@/lib/utils";

const tipoLabel: Record<string, string> = {
  destaque_home: "Destaque na Home",
  destaque_categoria: "Destaque na Categoria",
  destaque_cidade: "Destaque na Cidade",
  resultado_patrocinado: "Resultado Patrocinado",
  promocao_destacada: "Promoção Destacada",
};

export default function AnunciosPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Anúncios</h1>
      <p className="text-sm text-ink-500">Campanhas patrocinadas ativas na plataforma.</p>

      <div className="mt-4">
        <DataTable
          data={ads}
          rowKey={(a) => a.id}
          columns={[
            { key: "empresa", header: "Empresa", render: (a) => <span className="font-medium text-ink-900">{a.companyNome}</span> },
            { key: "tipo", header: "Tipo", render: (a) => tipoLabel[a.tipo] },
            { key: "cidade", header: "Cidade", render: (a) => a.cidade },
            { key: "periodo", header: "Período", render: (a) => `${formatDate(a.inicio)} — ${formatDate(a.termino)}` },
            { key: "impressoes", header: "Impressões", render: (a) => a.impressoes.toLocaleString("pt-BR") },
            { key: "cliques", header: "Cliques", render: (a) => a.cliques.toLocaleString("pt-BR") },
            { key: "status", header: "Status", render: (a) => <Badge variant={a.status === "ativo" ? "success" : a.status === "pausado" ? "warning" : "outline"}>{a.status}</Badge> },
          ]}
        />
      </div>
    </div>
  );
}
