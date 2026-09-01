"use client";

import { useState } from "react";
import { Globe, Bell, Shield } from "lucide-react";
import { Input, Button } from "@/components/ui";

export default function AdminConfiguracoesPage() {
  const [manutencao, setManutencao] = useState(false);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Configurações</h1>
      <p className="text-sm text-ink-500">Configurações gerais da plataforma BuscaZapp.</p>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Globe size={16} /> Geral
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <Input label="Nome da plataforma" defaultValue="BuscaZapp" />
          <Input label="E-mail de suporte" defaultValue="suporte@buscazapp.com.br" />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Bell size={16} /> Notificações internas
        </div>
        <label className="mt-3 flex items-center justify-between text-sm text-ink-700">
          Notificar equipe sobre novas reivindicações
          <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-600" />
        </label>
        <label className="mt-2 flex items-center justify-between text-sm text-ink-700">
          Notificar sobre pagamentos pendentes
          <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-600" />
        </label>
      </section>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Shield size={16} /> Modo manutenção
        </div>
        <label className="mt-3 flex items-center justify-between text-sm text-ink-700">
          Ativar modo de manutenção (bloqueia acesso público)
          <input
            type="checkbox"
            checked={manutencao}
            onChange={(e) => setManutencao(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
        </label>
      </section>

      <Button className="mt-6">Salvar configurações</Button>
    </div>
  );
}
