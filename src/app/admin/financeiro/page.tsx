"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, AlertCircle, MessageCircle, Trash2 } from "lucide-react";
import { DataTable, MetricCard, LoadingState, EmptyState, SearchInput, Select } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate, whatsappLink, cn } from "@/lib/utils";
import { Payment } from "@/types";

type PaymentStatus = "pago" | "pendente" | "falhou";

type FiltroStatus = "todos" | PaymentStatus;

const FILTROS: { valor: FiltroStatus; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "pago", label: "Pagos" },
  { valor: "pendente", label: "Pendentes" },
  { valor: "falhou", label: "Falharam" },
];

export default function AdminFinanceiroPage() {
  const { token } = useAuth();
  const [pagamentos, setPagamentos] = useState<Payment[]>([]);
  const [totais, setTotais] = useState({ receita: 0, pendente: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);
  const [termo, setTermo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/payments", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) {
          setPagamentos(json.data.pagamentos);
          setTotais(json.data.totais);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const results = useMemo(() => {
    return pagamentos.filter((p) => {
      if (filtroStatus !== "todos" && p.status !== filtroStatus) return false;
      if (termo) {
        const alvo = `${p.companyNome ?? ""} ${p.descricao}`.toLowerCase();
        if (!alvo.includes(termo.toLowerCase())) return false;
      }
      return true;
    });
  }, [pagamentos, termo, filtroStatus]);

  const alterarStatus = async (p: Payment, status: PaymentStatus) => {
    if (!token) return;
    setProcessando(p.id);
    try {
      const res = await fetch(`/api/admin/payments/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setPagamentos((prev) => prev.map((x) => (x.id === p.id ? json.data : x)));
      } else {
        alert(json?.error?.message ?? "Não foi possível alterar o status.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const excluir = async (p: Payment) => {
    if (!token) return;
    if (!confirm(`Excluir o lançamento "${p.descricao}" de "${p.companyNome}"? Não dá pra desfazer.`)) return;
    setProcessando(p.id);
    try {
      const res = await fetch(`/api/admin/payments/${p.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setPagamentos((prev) => prev.filter((x) => x.id !== p.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir esse lançamento.");
      }
    } finally {
      setProcessando(null);
    }
  };

  const mensagemCobranca = (p: Payment) =>
    `Olá, ${p.companyNome}! Aqui é da equipe BuscaZapp. Identificamos um pagamento em aberto: "${p.descricao}", no valor de ${formatCurrency(p.valor)}, com vencimento em ${formatDate(p.data)}. Pode nos confirmar o pagamento ou regularizar quando possível? Qualquer dúvida, estamos à disposição.`;

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Financeiro</h1>
      <p className="text-sm text-ink-500">Visão consolidada da receita da plataforma.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Receita recebida" value={formatCurrency(totais.receita)} icon={<DollarSign size={16} />} />
        <MetricCard label="MRR (assinaturas ativas)" value={formatCurrency(totais.mrr)} icon={<TrendingUp size={16} />} />
        <MetricCard label="Pagamentos pendentes" value={formatCurrency(totais.pendente)} icon={<AlertCircle size={16} />} />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink-900">Últimos pagamentos</h2>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por empresa ou descrição..." containerClassName="max-w-xs" />
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-ink-200 bg-white p-1">
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                type="button"
                onClick={() => setFiltroStatus(f.valor)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  filtroStatus === f.valor ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingState rows={3} />
        ) : results.length === 0 ? (
          <EmptyState title="Nenhum pagamento encontrado" description="Ajuste a busca ou o filtro de status acima." />
        ) : (
          <DataTable
            data={results}
            rowKey={(p) => p.id}
            columns={[
              { key: "empresa", header: "Empresa", render: (p) => p.companyNome ?? "—" },
              { key: "descricao", header: "Descrição", render: (p) => p.descricao },
              { key: "data", header: "Data", render: (p) => formatDate(p.data) },
              { key: "valor", header: "Valor", render: (p) => formatCurrency(p.valor) },
              {
                key: "status",
                header: "Status",
                render: (p) => (
                  <Select
                    value={p.status}
                    disabled={processando === p.id}
                    onChange={(e) => alterarStatus(p, e.target.value as PaymentStatus)}
                    className="!py-1.5 !text-xs"
                  >
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                    <option value="falhou">Falhou</option>
                  </Select>
                ),
              },
              {
                key: "acoes",
                header: "Ações",
                render: (p) => (
                  <div className="flex items-center gap-2">
                    {p.status !== "pago" &&
                      (p.companyWhatsapp ? (
                        <Link
                          href={whatsappLink(p.companyWhatsapp, mensagemCobranca(p))}
                          target="_blank"
                          className="flex items-center gap-1 text-xs font-medium text-[#25D366] hover:underline"
                          title="Enviar cobrança pelo WhatsApp"
                        >
                          <MessageCircle size={13} /> Cobrar no Zap
                        </Link>
                      ) : (
                        <span className="text-xs text-ink-300" title="Essa empresa não tem WhatsApp cadastrado">
                          Sem WhatsApp
                        </span>
                      ))}
                    <button
                      type="button"
                      disabled={processando === p.id}
                      onClick={() => excluir(p)}
                      className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
