import { Suspense } from "react";
import { LoadingState } from "@/components/ui";
import { ImpulsionarRetornoClient } from "./ImpulsionarRetornoClient";

export default function ImpulsionarRetornoPage() {
  return (
    <Suspense fallback={<LoadingState rows={3} />}>
      <ImpulsionarRetornoClient />
    </Suspense>
  );
}
