"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Select, MetricCard } from "@/components/ui";
import { Eye, MessageCircle, Percent, Ticket, Tag, Users } from "lucide-react";
import { useCurrentCompany } from "@/lib/useCurrentCompany";
import { getAnalyticsByCompany } from "@/mocks/analytics";
import { getPromotionsByCompany } from "@/mocks/promotions";

export default function EstatisticasPage() {
  const company = useCurrentCompany();
  const analytics = getAnalyticsByCompany(company.id);
  const promotions = getPromotionsByCompany(company.id);
  const [periodo, setPeriodo] = useState("30");

  const serie = analytics?.serieDiaria.slice(-Number(periodo)) ?? [];
  const conversao = analytics
    ? ((analytics.leads / Math.max(analytics.visualizacoes, 1)) * 100).toFixed(1)
    : "0.0";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Estatísticas</h1>
          <p className="text-sm text-ink-500">Análise detalhada do desempenho do seu perfil.</p>
        </div>
        <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} containerClassName="w-40">
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </Select>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Visualizações" value={analytics?.visualizacoes ?? 0} icon={<Eye size={16} />} />
        <MetricCard label="Cliques" value={analytics?.cliquesWhatsapp ?? 0} icon={<MessageCircle size={16} />} />
        <MetricCard label="Conversão" value={`${conversao}%`} icon={<Percent size={16} />} />
        <MetricCard label="Cupons" value={analytics?.cuponsUtilizados ?? 0} icon={<Ticket size={16} />} />
        <MetricCard label="Ofertas ativas" value={promotions.filter((p) => p.status === "ativa").length} icon={<Tag size={16} />} />
        <MetricCard label="Leads" value={analytics?.leads ?? 0} icon={<Users size={16} />} />
      </div>

      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-900">Visualizações x Cliques x Leads</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(8)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="visualizacoes" name="Visualizações" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cliquesWhatsapp" name="Cliques WhatsApp" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="leads" name="Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
