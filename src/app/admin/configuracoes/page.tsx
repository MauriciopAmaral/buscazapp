"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Globe, Bell, Shield, Check, Palette, LayoutGrid, PenLine, Trash2 } from "lucide-react";
import { Input, Textarea, Button, LoadingState } from "@/components/ui";
import { ImageUploadField } from "@/components/painel/ImageUploadField";
import { useAuth } from "@/context/AuthContext";
import { PALETAS, PALETA_LABELS, PaletaKey } from "@/lib/palettes";
import { cn } from "@/lib/utils";

interface Settings {
  nomePlataforma: string;
  emailSuporte: string;
  logoUrl: string | null;
  paletaCor: string;
  notificarReivindicacoes: boolean;
  notificarPagamentosPendentes: boolean;
  modoManutencao: boolean;
  mostrarCategoriasPopulares: boolean;
  mostrarEmpresasPertoDeVoce: boolean;
  mostrarOfertas: boolean;
  mostrarCupons: boolean;
  mostrarEmpresasDestaque: boolean;
  rodapeTexto: string;
}

const MODULOS_HOME: { key: keyof Settings; label: string }[] = [
  { key: "mostrarCategoriasPopulares", label: "Categorias populares" },
  { key: "mostrarEmpresasPertoDeVoce", label: "Empresas perto de você" },
  { key: "mostrarOfertas", label: "Ofertas perto de você" },
  { key: "mostrarCupons", label: "Cupons para você economizar" },
  { key: "mostrarEmpresasDestaque", label: "Empresas em destaque" },
];

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

          <div>
            <label className="text-sm font-medium text-ink-700">Logo do site</label>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
                {settings.logoUrl ? (
                  <Image src={settings.logoUrl} alt="Logo atual" width={56} height={56} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <span className="text-lg font-bold text-brand-600">{settings.nomePlataforma.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <ImageUploadField
                token={token}
                pasta="logo"
                endpoint="/api/admin/upload"
                label={settings.logoUrl ? "Trocar logo" : "Enviar logo"}
                onUploaded={(url) => setSettings({ ...settings, logoUrl: url })}
              />
              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, logoUrl: null })}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                  title="Remover logo (volta pro ícone com a inicial do nome)"
                >
                  <Trash2 size={13} /> Remover
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-ink-400">JPG, PNG ou WEBP, até 4MB. Sem logo, usa a inicial do nome da plataforma.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Palette size={16} /> Paleta de cores
        </div>
        <p className="mt-1 text-xs text-ink-500">Muda a cor principal usada em botões, links e destaques em todo o site.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(PALETAS) as PaletaKey[]).map((chave) => (
            <button
              key={chave}
              type="button"
              onClick={() => setSettings({ ...settings, paletaCor: chave })}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                settings.paletaCor === chave ? "border-ink-900 bg-ink-50" : "border-ink-200 hover:bg-ink-50"
              )}
            >
              <span className="flex h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: PALETAS[chave][600] }} />
              {PALETA_LABELS[chave]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <LayoutGrid size={16} /> Módulos da página inicial
        </div>
        <p className="mt-1 text-xs text-ink-500">Desligue aqui pra esconder a seção inteira da home pública.</p>
        <div className="mt-3 flex flex-col gap-2">
          {MODULOS_HOME.map((mod) => (
            <label key={String(mod.key)} className="flex items-center justify-between text-sm text-ink-700">
              {mod.label}
              <input
                type="checkbox"
                checked={Boolean(settings[mod.key])}
                onChange={(e) => setSettings({ ...settings, [mod.key]: e.target.checked })}
                className="h-4 w-4 accent-brand-600"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <PenLine size={16} /> Rodapé
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Aparece no final de todas as páginas, depois de &ldquo;© {new Date().getFullYear()} {settings.nomePlataforma}.&rdquo;
        </p>
        <Textarea
          className="mt-2"
          rows={2}
          value={settings.rodapeTexto}
          onChange={(e) => setSettings({ ...settings, rodapeTexto: e.target.value })}
        />
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

      <div className="sticky bottom-4 mt-6 flex items-center gap-3 rounded-2xl border border-ink-200 bg-white/95 p-3 backdrop-blur">
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
