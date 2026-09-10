import { Suspense } from "react";
import { PlanosComprarClient } from "./PlanosComprarClient";

export const metadata = { title: "Adquirir plano — BuscaZapp" };

export default function PlanosComprarPage() {
  return (
    <Suspense>
      <PlanosComprarClient />
    </Suspense>
  );
}
