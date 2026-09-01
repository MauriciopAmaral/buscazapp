"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowUpRight, CheckCircle2, Clock, Undo2 } from "lucide-react";
import { Badge, EmptyState, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { cashbackService } from "@/services/cashbackService";
import { formatDate } from "@/lib/utils";
import { CashbackTransaction } from "@/types";

const statusMeta: Record<
  CashbackTransaction["status"],
  { label: string; variant: "success" | "warning" | "ink"; icon: React.ReactNode }
> = {
  creditado: { label: "Creditado", variant: "success", icon: <CheckCircle2 size={12} /> },
  pendente: { label: "Pendente", variant: "warning", icon: <Clock size={12} /> },
  resgatado: { label: "Resgatado", variant: "ink", icon: <Undo2 size={12} /> },
};

export default function CashbackPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [saldo, setSaldo] = useState(0);
  const [extrato, setExtrato] = useState<CashbackTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!user || !token) return;
    let active = true;
    cashbackService.getSaldoEExtrato(token).then(({ saldo: s, extrato: e }) => {
      if (!active) return;
      setSaldo(s);
      setExtrato(e);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [authLoading, user, token, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-ink-500">
        <Wallet size={16} />
        <span className="text-sm">BuscaZapp Cashback</span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-ink-900 sm:text-3xl">Meu cashback</h1>
      <p className="mt-1 text-sm text-ink-500">
        Parte do valor que você gasta em empresas participantes volta pra sua conta.
      </p>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-xs font-medium text-emerald-700">Saldo disponível</p>
        <p className="mt-1 text-3xl font-bold text-emerald-800">R$ {saldo.toFixed(2)}</p>
        <p className="mt-2 text-xs text-emerald-700">
          Use o saldo em compras futuras nas empresas participantes do programa. Este protótipo ainda
          não processa resgates de verdade — isso passa a funcionar quando o backend estiver no ar.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-ink-800">Extrato</h2>
        <div className="mt-3">
          {loading ? (
            <LoadingState />
          ) : extrato.length === 0 ? (
            <EmptyState
              icon={<Wallet size={22} />}
              title="Nenhuma movimentação ainda"
              description="Compre em empresas participantes do cashback para começar a acumular saldo."
              action={
                <Link href="/buscar" className="text-sm font-semibold text-brand-700 hover:underline">
                  Ver empresas participantes
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-ink-100 rounded-2xl border border-ink-200 bg-white">
              {extrato.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{t.companyNome}</p>
                    <p className="text-xs text-ink-400">
                      {formatDate(t.data)} · Compra de R$ {t.valorCompra.toFixed(2)} · {t.percentual}%
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      <ArrowUpRight size={14} />+R$ {t.valorCashback.toFixed(2)}
                    </span>
                    <Badge variant={statusMeta[t.status].variant} icon={statusMeta[t.status].icon}>
                      {statusMeta[t.status].label}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
