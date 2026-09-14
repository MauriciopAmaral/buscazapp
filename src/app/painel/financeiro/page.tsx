import { Suspense } from "react";
import { LoadingState } from "@/components/ui";
import { FinanceiroClient } from "./FinanceiroClient";

export default function FinanceiroPage() {
  return (
    <Suspense fallback={<LoadingState rows={4} />}>
      <FinanceiroClient />
    </Suspense>
  );
}
