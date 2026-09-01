// Camada de serviço do BuscaZapp Cashback — chama a API real (GET /api/cashback),
// autenticada por token (a mesma API que os apps Android/iOS vão usar).

import { CashbackTransaction } from "@/types";

interface CashbackApiExtratoItem {
  id: string;
  userId: string;
  companyId: string;
  companyNome: string;
  data: string;
  // Campos monetários vêm como string na API (Decimal do Prisma) — ver API.md.
  valorCompra: string | number;
  percentual: number;
  valorCashback: string | number;
  status: CashbackTransaction["status"];
}

function toTransaction(item: CashbackApiExtratoItem): CashbackTransaction {
  return {
    id: item.id,
    userId: item.userId,
    companyId: item.companyId,
    companyNome: item.companyNome,
    data: item.data,
    valorCompra: Number(item.valorCompra),
    percentual: item.percentual,
    valorCashback: Number(item.valorCashback),
    status: item.status,
  };
}

async function fetchCashback(token: string): Promise<{ saldo: number; extrato: CashbackTransaction[] }> {
  const res = await fetch("/api/cashback", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    return { saldo: 0, extrato: [] };
  }
  return {
    saldo: Number(json.data.saldo),
    extrato: (json.data.extrato as CashbackApiExtratoItem[]).map(toTransaction),
  };
}

export const cashbackService = {
  async getSaldoEExtrato(token: string): Promise<{ saldo: number; extrato: CashbackTransaction[] }> {
    return fetchCashback(token);
  },
};
