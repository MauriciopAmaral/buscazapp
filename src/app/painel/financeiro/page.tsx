"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Calendar, RefreshCw } from "lucide-react";
import { DataTable, Badge, Select, Button, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrocarPlanoPagamento } from "@/components/painel/TrocarPlanoPagamento";

type Periodicidade = "mensal" | "trimestral" | "anual";

interface PlanoReal {
  id: string;
  nome: string;
  precoMensal: number;
  precoTrimestral: number;
  precoAnual: number;
}

interface PagamentoReal {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  status: "pago" | "pendente" | "falhou";
}

export default function FinanceiroPage() {
  const { token } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [planoId, setPlanoId] = useState("gratuito");
  const [subscription, setSubscription] = useState<{
    planoId: string;
    periodicidade: Periodicidade;
    status: string;
    proximaCobranca: string;
    valor: number;
  } | null>(null);
  const [payments, setPayments] = useState<PagamentoReal[]>([]);
  const [planos, setPlanos] = useState<PlanoReal[]>([]);

  const [trocando, setTrocando] = useState(false);
  const [novoPlanoId, setNovoPlanoId] = useState("");
  const [novaPeriodicidade, setNovaPeriodicidade] = useState<Periodicidade>("mensal");

  const carregar = useCallback(async () => {
    if (!token) return;
    setCarregando(true);
    try {
      const [resSub, resPlanos] = await Promise.all([
        fetch("/api/painel/subscription", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/planos"),
      ]);
      const jsonSub = await resSub.json().catch(() => null);
      const jsonPlanos = await resPlanos.json().catch(() => null);
      if (jsonSub?.success) {
        setPlanoId(jsonSub.data.planoId);
        setSubscription(jsonSub.data.subscription);
        setPayments(jsonSub.data.payments);
      }
      if (jsonPlanos?.success) {
        setPlanos(jsonPlanos.data);
        if (!novoPlanoId && jsonPlanos.data[0]) setNovoPlanoId(jsonPlanos.data[0].id);
      }
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assinatura/histórico e catálogo de planos assim que o token estiver disponível
    carregar();
  }, [carregar]);

  const plano = planos.find((p) => p.id === planoId);
  const planoEscolhido = planos.find((p) => p.id === novoPlanoId);

  if (carregando) return <LoadingState rows={4} />;

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Financeiro</h1>
      <p className="text-sm text-ink-500">Acompanhe cobranças e o histórico de pagamentos.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <CreditCard size={16} className="text-ink-400" /> Plano atual
          </div>
          <p className="mt-2 text-lg font-bold text-ink-900">{plano?.nome ?? planoId}</p>
          <p className="text-sm text-ink-500">
            {subscription ? `${formatCurrency(subscription.valor)} / ${subscription.periodicidade}` : "Plano gratuito"}
          </p>
          {subscription && (
            <Badge variant={subscription.status === "atrasada" ? "danger" : "success"} className="mt-2">
              {subscription.status}
            </Badge>
          )}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <Calendar size={16} className="text-ink-400" /> Próxima cobrança
          </div>
          <p className="mt-2 text-lg font-bold text-ink-900">
            {subscription ? formatDate(subscription.proximaCobranca) : "—"}
          </p>
          <p className="text-sm text-ink-500">
            {subscription ? "Cobrada por cartão de crédito ou Pix, quando você trocar de plano" : "Nenhuma assinatura ativa"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <RefreshCw size={16} /> Trocar plano
        </div>

        {trocando ? (
          <div className="mt-4 max-w-md">
            <TrocarPlanoPagamento
              token={token ?? ""}
              planoId={novoPlanoId}
              nomePlano={planoEscolhido?.nome ?? novoPlanoId}
              periodicidade={novaPeriodicidade}
              onCancelar={() => setTrocando(false)}
              onConcluido={() => {
                setTrocando(false);
                carregar();
              }}
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <Select
              label="Novo plano"
              containerClassName="flex-1"
              value={novoPlanoId}
              onChange={(e) => setNovoPlanoId(e.target.value)}
            >
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
            <Select
              label="Periodicidade"
              containerClassName="sm:w-48"
              value={novaPeriodicidade}
              onChange={(e) => setNovaPeriodicidade(e.target.value as Periodicidade)}
            >
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </Select>
            <Button onClick={() => setTrocando(true)} disabled={!novoPlanoId || novoPlanoId === planoId}>
              Continuar para pagamento
            </Button>
          </div>
        )}
        {!trocando && novoPlanoId === planoId && (
          <p className="mt-2 text-xs text-ink-400">Esse já é o seu plano atual — escolha outro pra trocar.</p>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Histórico de pagamentos</h2>
        <DataTable
          data={payments}
          rowKey={(p) => p.id}
          emptyTitle="Nenhum pagamento registrado"
          columns={[
            { key: "data", header: "Data", render: (p) => formatDate(p.data) },
            { key: "descricao", header: "Descrição", render: (p) => p.descricao },
            { key: "valor", header: "Valor", render: (p) => formatCurrency(p.valor) },
            {
              key: "status",
              header: "Status",
              render: (p) => (
                <Badge variant={p.status === "pago" ? "success" : p.status === "pendente" ? "warning" : "danger"}>
                  {p.status}
                </Badge>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
