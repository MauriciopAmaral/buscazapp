import { CashbackTransaction } from "@/types";
import { getCashbackCompanies } from "./companies";
import { users } from "./users";

function iso(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

const consumidor = users.find((u) => u.role === "consumidor")!;
const cashbackCompanies = getCashbackCompanies();

const templates: { valorCompra: number; diasAtras: number; status: CashbackTransaction["status"] }[] = [
  { valorCompra: 89.9, diasAtras: 2, status: "creditado" },
  { valorCompra: 145, diasAtras: 9, status: "creditado" },
  { valorCompra: 62.5, diasAtras: 18, status: "creditado" },
  { valorCompra: 210, diasAtras: 1, status: "pendente" },
  { valorCompra: 38, diasAtras: 30, status: "resgatado" },
];

export const cashbackTransactions: CashbackTransaction[] = templates.map((t, i) => {
  const company = cashbackCompanies[i % cashbackCompanies.length];
  const percentual = company.cashbackPercentual ?? 0;
  return {
    id: `cashback-${i + 1}`,
    userId: consumidor.id,
    companyId: company.id,
    companyNome: company.nomeFantasia,
    data: iso(t.diasAtras),
    valorCompra: t.valorCompra,
    percentual,
    valorCashback: Number(((t.valorCompra * percentual) / 100).toFixed(2)),
    status: t.status,
  };
});

export function getCashbackTransactionsByUser(userId: string) {
  return cashbackTransactions.filter((t) => t.userId === userId);
}

export function getCashbackSaldo(userId: string) {
  return cashbackTransactions
    .filter((t) => t.userId === userId && t.status === "creditado")
    .reduce((sum, t) => sum + t.valorCashback, 0);
}
