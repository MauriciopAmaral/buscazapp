"use client";

import { useState } from "react";
import { Bell, Lock, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useCurrentCompany } from "@/lib/useCurrentCompany";

export default function ConfiguracoesPage() {
  const company = useCurrentCompany();
  const [notificacoes, setNotificacoes] = useState({ leads: true, avaliacoes: true, financeiro: false });

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Configurações</h1>
      <p className="text-sm text-ink-500">Preferências da conta de {company.nomeFantasia}.</p>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Bell size={16} /> Notificações
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {[
            { key: "leads" as const, label: "Novos leads" },
            { key: "avaliacoes" as const, label: "Novas avaliações" },
            { key: "financeiro" as const, label: "Alertas financeiros" },
          ].map((n) => (
            <label key={n.key} className="flex items-center justify-between text-sm text-ink-700">
              {n.label}
              <input
                type="checkbox"
                checked={notificacoes[n.key]}
                onChange={(e) => setNotificacoes((prev) => ({ ...prev, [n.key]: e.target.checked }))}
                className="h-4 w-4 accent-brand-600"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Lock size={16} /> Segurança
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <Input label="Nova senha" type="password" placeholder="••••••••" />
          <Input label="Confirmar nova senha" type="password" placeholder="••••••••" />
          <Button className="w-fit">Atualizar senha</Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
          <Trash2 size={16} /> Zona de risco
        </div>
        <p className="mt-1 text-xs text-red-600">Excluir sua conta removerá permanentemente seu perfil do BuscaZapp.</p>
        <Button variant="danger" size="sm" className="mt-3">
          Excluir conta
        </Button>
      </section>
    </div>
  );
}
