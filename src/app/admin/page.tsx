"use client";

import { Building2, ShieldCheck, Crown, Users, CreditCard, DollarSign, Users2, Ticket } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { MetricCard } from "@/components/ui";
import { companies } from "@/mocks/companies";
import { users } from "@/mocks/users";
import { subscriptions, planos } from "@/mocks/subscriptions";
import { companyAnalytics, leads } from "@/mocks/analytics";
import { coupons } from "@/mocks/coupons";

const COLORS = ["#059669", "#f97316", "#3b82f6", "#a855f7"];

export default function AdminDashboardPage() {
  const totalEmpresas = companies.length;
  const reivindicadas = companies.filter((c) => c.reivindicada).length;
  const premium = companies.filter((c) => c.premium).length;
  const assinaturasAtivas = subscriptions.filter((s) => s.status === "ativa").length;
  const mrr = subscriptions.reduce((acc, s) => acc + s.valor, 0);
  const totalLeads = leads.length;
  const cuponsUtilizados = coupons.reduce((acc, c) => acc + c.utilizados, 0);

  const serie = companyAnalytics[0]?.serieDiaria.map((point, i) => {
    const totalDia = companyAnalytics.reduce((acc, a) => acc + (a.serieDiaria[i]?.visualizacoes ?? 0), 0);
    return { data: point.data, visualizacoes: totalDia };
  });

  const planData = planos.map((p) => ({ name: p.nome, value: p.assinantes }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Dashboard administrativo</h1>
        <p className="text-sm text-ink-500">Visão geral da plataforma BuscaZapp.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total de empresas" value={totalEmpresas} icon={<Building2 size={16} />} />
        <MetricCard label="Reivindicadas" value={reivindicadas} icon={<ShieldCheck size={16} />} />
        <MetricCard label="Empresas Premium" value={premium} icon={<Crown size={16} />} />
        <MetricCard label="Usuários" value={users.length} icon={<Users size={16} />} />
        <MetricCard label="Assinaturas ativas" value={assinaturasAtivas} icon={<CreditCard size={16} />} />
        <MetricCard label="MRR" value={`R$ ${mrr.toFixed(0)}`} icon={<DollarSign size={16} />} />
        <MetricCard label="Leads" value={totalLeads} icon={<Users2 size={16} />} />
        <MetricCard label="Cupons utilizados" value={cuponsUtilizados} icon={<Ticket size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-900">Visualizações totais — últimos 30 dias</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie}>
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
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ink-900">Assinantes por plano</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {planData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
