// Camada de serviço do BuscaZapp Cashback — hoje consome os mocks locais.
// No futuro, passa a ler/gravar na tabela CashbackTransaction via API real.

import { CashbackTransaction } from "@/types";
import {
  getCashbackTransactionsByUser,
  getCashbackSaldo,
} from "@/mocks/cashback";
import { getCashbackCompanies } from "@/mocks/companies";

export const cashbackService = {
  async getSaldo(userId: string): Promise<number> {
    return Promise.resolve(getCashbackSaldo(userId));
  },

  async getExtrato(userId: string): Promise<CashbackTransaction[]> {
    return Promise.resolve(
      getCashbackTransactionsByUser(userId).sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      )
    );
  },

  async getEmpresasParticipantes() {
    return Promise.resolve(getCashbackCompanies());
  },
};
