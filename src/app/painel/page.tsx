"use client";

import { Eye, MessageCircle, Users, Ticket, Star, ImagePlus, Clock, ListChecks } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";
import { MetricCard } from "@/components/ui";
import { useCurrentCompany } from "@/lib/useCurrentCompany";
import { getAnalyticsByCompany } from "@/mocks/analytics";

export default function PainelDashboardPage() {
  const company = useCurrentCompany();
  const analytics = getAnalyticsByCompany(company.id);
  const serie = analytics?.serieDiaria.slice(-30) ?? [];

  const completude = 75;
  const sugestoes = [
    { icon: <ImagePlus size={16} />, label: "Adicione mais fotos" },
    { icon: <Clock size={16} />, label: "Informe seu horário" },
    { icon: <ListChecks size={16} />, label: "Cadastre seus serviços" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Olá, {company.nomeFantasia} 👋</h1>
        <p className="text-sm text-ink-500">Aqui está um resumo do desempenho do seu perfil.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Visualizações" value={analytics?.visualizacoes ?? 1240} icon={<Eye size={16} />} trend={8} />
        <MetricCard label="Cliques no WhatsApp" value={analytics?.cliquesWhatsapp ?? 287} icon={<MessageCircle size={16} />} trend={12} />
        <MetricCard label="Leads" value={analytics?.leads ?? 93} icon={<Users size={16} />} trend={4} />
        <MetricCard label="Cupons utilizados" value={analytics?.cuponsUtilizados ?? 46} icon={<Ticket size={16} />} trend={-2} />
        <MetricCard label="Avaliação" value={company.avaliacaoMedia.toFixed(1)} icon={<Star size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-900">Visualizações — últimos 30 dias</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(8)} />
                <Tooltip />
                <Area type="monotone" dataKey="visualizacoes" stroke="#059669" fill="url(#colorViews)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ink-900">Seu perfil está {completude}% completo</h2>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${completude}%` }} />
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {sugestoes.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm text-ink-600">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  {s.icon}
                </span>
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChartCard title="Cliques WhatsApp" dataKey="cliquesWhatsapp" data={serie} color="#f97316" />
        <ChartCard title="Leads" dataKey="leads" data={serie} color="#3b82f6" />
        <ChartCard title="Cupons utilizados" dataKey="cuponsUtilizados" data={serie} color="#ef4444" />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  dataKey,
  data,
  color,
}: {
  title: string;
  dataKey: string;
  data: { data: string }[];
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <h3 className="text-xs font-semibold text-ink-700">{title}</h3>
      <div className="mt-2 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
