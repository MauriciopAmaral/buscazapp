"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Button, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";

interface RelatoriosData {
  totais: {
    empresas: number;
    categorias: number;
    cidades: number;
    assinaturasAtivas: number;
    leads: number;
    receita: number;
    taxaConversao: number;
  };
  empresasPorCidade: { nome: string; total: number }[];
  empresasPorCategoria: { nome: string; total: number }[];
  leadsPorOrigem: { nome: string; total: number }[];
}

export default function RelatoriosPage() {
  const { token } = useAuth();
  const [dados, setDados] = useState<RelatoriosData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/reports", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setDados(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const t = dados?.totais;

  const relatorios = [
    { titulo: "Empresas", descricao: t ? `${t.empresas} empresas cadastradas` : "Distribuição de empresas por cidade" },
    { titulo: "Assinaturas", descricao: t ? `${t.assinaturasAtivas} assinaturas ativas na base` : "" },
    { titulo: "Receita", descricao: t ? `${formatCurrency(t.receita)} recebidos até agora` : "Receita consolidada por período" },
    { titulo: "Leads", descricao: t ? `${t.leads} leads gerados no total` : "Leads gerados por origem" },
    { titulo: "Categorias", descricao: t ? `${t.categorias} categorias ativas` : "Empresas por categoria" },
    { titulo: "Cidades", descricao: t ? `${t.cidades} cidades com cobertura` : "Cobertura geográfica" },
    { titulo: "Conversões", descricao: t ? `${t.taxaConversao}% de visitas viram lead` : "Taxa de conversão de visitas em leads" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Relatórios</h1>
          <p className="text-sm text-ink-500">Visão consolidada de indicadores da plataforma.</p>
        </div>
        <Button variant="outline" icon={<Download size={16} />} disabled>
          Exportar (em breve)
        </Button>
      </div>

      {loading || !dados ? (
        <div className="mt-6">
          <LoadingState rows={4} />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {relatorios.map((r) => (
              <div key={r.titulo} className="rounded-xl border border-ink-200 bg-white p-3">
                <p className="text-xs font-semibold text-ink-900">{r.titulo}</p>
                <p className="mt-1 text-xs text-ink-500">{r.descricao}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartBlock title="Empresas por cidade" data={dados.empresasPorCidade} color="#059669" />
            <ChartBlock title="Top categorias" data={dados.empresasPorCategoria} color="#f97316" />
            <ChartBlock title="Leads por origem" data={dados.leadsPorOrigem} color="#3b82f6" />
          </div>
        </>
      )}
    </div>
  );
}

function ChartBlock({ title, data, color }: { title: string; data: { nome: string; total: number }[]; color: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
      <div className="mt-3 h-56">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-ink-400">Sem dados ainda.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={90} />
              <Tooltip />
              <Bar dataKey="total" fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
