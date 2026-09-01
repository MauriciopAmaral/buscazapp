"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { LoadingState } from "@/components/ui";

/**
 * Protege uma área inteira (painel da empresa, admin) — redireciona pro
 * login se não estiver autenticado, ou pra home se o papel não bater
 * (ex: um consumidor tentando abrir /admin).
 */
export function RequireRole({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace("/");
    }
  }, [isLoading, user, role, router]);

  if (isLoading || !user || user.role !== role) {
    return (
      <div className="p-6">
        <LoadingState rows={2} />
      </div>
    );
  }

  return <>{children}</>;
}
