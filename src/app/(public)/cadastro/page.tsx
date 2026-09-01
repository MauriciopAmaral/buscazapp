import { Suspense } from "react";
import { CadastroClient } from "./CadastroClient";

export const metadata = { title: "Cadastro — BuscaZapp" };

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="px-6 py-14 text-center text-sm text-ink-500">Carregando...</div>}>
      <CadastroClient />
    </Suspense>
  );
}
