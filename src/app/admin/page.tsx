"use client";

import { useEffect, useState } from "react";
import { Building2, ShieldCheck, Crown, Users, CreditCard, DollarSign, Users2, Ticket } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { MetricCard, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#059669", "#f97316", "#3b82f6", "#a855f7"];

interface DashboardData {
  totalEmpresas: number;
  reivindicadas: number;
  premium: number;
  totalUsuarios: number;
  assinaturasAtivas: number;
  mrr: number;
  totalLeads: number;
  cuponsUtilizados: number;
  serie: { data: string; visualizacoes: number }[];
  planData: { name: string; value: number }[];
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setDados(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Dashboard administrativo</h1>
        <p className="text-sm text-ink-500">Visão geral da plataforma.</p>
      </div>

      {loading || !dados ? (
        <LoadingState rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Total de empresas" value={dados.totalEmpresas} icon={<Building2 size={16} />} />
            <MetricCard label="Reivindicadas" value={dados.reivindicadas} icon={<ShieldCheck size={16} />} />
            <MetricCard label="Empresas Premium" value={dados.premium} icon={<Crown size={16} />} />
            <MetricCard label="Usuários" value={dados.totalUsuarios} icon={<Users size={16} />} />
            <MetricCard label="Assinaturas ativas" value={dados.assinaturasAtivas} icon={<CreditCard size={16} />} />
            <MetricCard label="MRR" value={formatCurrency(dados.mrr)} icon={<DollarSign size={16} />} />
            <MetricCard label="Leads" value={dados.totalLeads} icon={<Users2 size={16} />} />
            <MetricCard label="Cupons utilizados" value={dados.cuponsUtilizados} icon={<Ticket size={16} />} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-ink-200 bg-white p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-ink-900">Visualizações totais — últimos 30 dias</h2>
              <div className="mt-4 h-64">
                {dados.serie.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-ink-400">
                    Sem dados de visualização ainda.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dados.serie}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(8)} />
                      <Tooltip />
                      <Area type="monotone" dataKey="visualizacoes" stroke="#059669" fill="url(#colorTotal)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-ink-900">Assinantes por plano</h2>
              <div className="mt-4 h-64">
                {dados.planData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-ink-400">
                    Nenhum assinante ainda.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dados.planData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {dados.planData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
