import { Suspense } from "react";
import { BuscarClient } from "./BuscarClient";

export const metadata = { title: "Buscar — BuscaZapp" };

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">Carregando busca...</div>}>
      <BuscarClient />
    </Suspense>
  );
}
