"use client";

import { useEffect, useState } from "react";
import { Globe, Bell, Shield, Check } from "lucide-react";
import { Input, Button, LoadingState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

interface Settings {
  nomePlataforma: string;
  emailSuporte: string;
  notificarReivindicacoes: boolean;
  notificarPagamentosPendentes: boolean;
  modoManutencao: boolean;
}

export default function AdminConfiguracoesPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara o carregamento assim que o token fica disponível
    setLoading(true);
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setSettings(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const salvar = async () => {
    if (!token || !settings) return;
    setSalvando(true);
    setErro(null);
    setSalvo(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setSettings(json.data);
        setSalvo(true);
        setTimeout(() => setSalvo(false), 3000);
      } else {
        setErro(json?.error?.message ?? "Não foi possível salvar as configurações.");
      }
    } finally {
      setSalvando(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Configurações</h1>
        <p className="text-sm text-ink-500">Configurações gerais da plataforma BuscaZapp.</p>
        <div className="mt-6">
          <LoadingState rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Configurações</h1>
      <p className="text-sm text-ink-500">Configurações gerais da plataforma BuscaZapp.</p>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Globe size={16} /> Geral
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <Input
            label="Nome da plataforma"
            value={settings.nomePlataforma}
            onChange={(e) => setSettings({ ...settings, nomePlataforma: e.target.value })}
          />
          <Input
            label="E-mail de suporte"
            type="email"
            value={settings.emailSuporte}
            onChange={(e) => setSettings({ ...settings, emailSuporte: e.target.value })}
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Bell size={16} /> Notificações internas
        </div>
        <label className="mt-3 flex items-center justify-between text-sm text-ink-700">
          Notificar equipe sobre novas reivindicações
          <input
            type="checkbox"
            checked={settings.notificarReivindicacoes}
            onChange={(e) => setSettings({ ...settings, notificarReivindicacoes: e.target.checked })}
            className="h-4 w-4 accent-brand-600"
          />
        </label>
        <label className="mt-2 flex items-center justify-between text-sm text-ink-700">
          Notificar sobre pagamentos pendentes
          <input
            type="checkbox"
            checked={settings.notificarPagamentosPendentes}
            onChange={(e) => setSettings({ ...settings, notificarPagamentosPendentes: e.target.checked })}
            className="h-4 w-4 accent-brand-600"
          />
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
            checked={settings.modoManutencao}
            onChange={(e) => setSettings({ ...settings, modoManutencao: e.target.checked })}
            className="h-4 w-4 accent-brand-600"
          />
        </label>
        {settings.modoManutencao && (
          <p className="mt-2 text-xs text-amber-700">
            Com isso ligado, quem visitar o site vê uma tela de manutenção. O admin continua acessando normalmente
            por aqui e por /login.
          </p>
        )}
      </section>

      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar configurações"}
        </Button>
        {salvo && (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
            <Check size={15} /> Salvo
          </span>
        )}
      </div>
    </div>
  );
}
