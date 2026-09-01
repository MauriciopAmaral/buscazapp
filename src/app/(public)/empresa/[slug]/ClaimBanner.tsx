"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

export function ClaimBanner({ companySlug }: { companySlug: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Esta empresa ainda não administra este perfil.
          </p>
          <p className="text-xs text-amber-700">
            As informações mostradas são públicas e podem estar desatualizadas.
          </p>
        </div>
      </div>
      <Link href={`/reivindicar/${companySlug}`}>
        <Button variant="secondary" size="sm">
          SOU PROPRIETÁRIO DESTA EMPRESA
        </Button>
      </Link>
    </div>
  );
}
