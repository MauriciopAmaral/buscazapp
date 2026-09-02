"use client";

import { useState } from "react";
import { Database, Tags, MapPinned, Home as HomeIcon, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function DadosDeReferenciaPage() {
  const { token } = useAuth();

  const [rodandoCategorias, setRodandoCategorias] = useState(false);
  const [resultadoCategorias, setResultadoCategorias] = useState<string | null>(null);

  const [rodandoCidades, setRodandoCidades] = useState(false);
  const [progressoCidades, setProgressoCidades] = useState<{ feito: number; total: number; criadas: number } | null>(null);

  const [rodandoBairros, setRodandoBairros] = useState(false);
  const [resultadoBairros, setResultadoBairros] = useState<string | null>(null);

  const importarCategorias = async () => {
    if (!token) return;
    setRodandoCategorias(true);
    setResultadoCategorias(null);
    try {
      const res = await fetch("/api/admin/seed/categories", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setResultadoCategorias(`${json.data.criadas} categorias novas criadas (de ${json.data.totalNaLista} na lista — as demais já existiam).`);
      } else {
        setResultadoCategorias(json?.error?.message ?? "Não foi possível importar as categorias.");
      }
    } finally {
      setRodandoCategorias(false);
    }
  };

  const importarCidades = async () => {
    if (!token) return;
    setRodandoCidades(true);
    setProgressoCidades({ feito: 0, total: UFS.length, criadas: 0 });
    let totalCriadas = 0;
    for (let i = 0; i < UFS.length; i++) {
      const uf = UFS[i];
      try {
        const res = await fetch(`/api/admin/seed/cities?uf=${uf}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) totalCriadas += json.data.criadas;
      } catch {
        // segue pros outros estados mesmo se um falhar
      }
      setProgressoCidades({ feito: i + 1, total: UFS.length, criadas: totalCriadas });
    }
    setRodandoCidades(false);
  };

  const importarBairros = async () => {
    if (!token) return;
    setRodandoBairros(true);
    setResultadoBairros(null);
    try {
      const res = await fetch("/api/admin/seed/neighborhoods", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        const partes = Object.entries(json.data as Record<string, { criados: number; total: number }>).map(
          ([cidade, r]) => `${cidade}: ${r.criados} de ${r.total}`
        );
        setResultadoBairros(partes.join(" · "));
      } else {
        setResultadoBairros(json?.error?.message ?? "Não foi possível importar os bairros.");
      }
    } finally {
      setRodandoBairros(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Dados de referência</h1>
      <p className="text-sm text-ink-500">
        Importações de uma vez só pra popular o banco com categorias, estados/cidades e bairros — pode rodar
        de novo a qualquer momento sem duplicar o que já existe.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Tags size={18} />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-ink-900">Categorias</h2>
              <p className="mt-0.5 text-xs text-ink-500">Importa ~55 segmentos comuns de negócio local (Academias, Barbearias, Guinchos, etc.).</p>
              <Button size="sm" className="mt-3" disabled={rodandoCategorias} onClick={importarCategorias} icon={rodandoCategorias ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}>
                {rodandoCategorias ? "Importando..." : "Importar categorias"}
              </Button>
              {resultadoCategorias && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-700">
                  <CheckCircle2 size={14} /> {resultadoCategorias}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <MapPinned size={18} />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-ink-900">Estados e cidades</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                Importa todos os ~5.570 municípios do Brasil, direto da API oficial do IBGE — um estado por vez (leva
                cerca de 1 minuto no total).
              </p>
              <Button size="sm" className="mt-3" disabled={rodandoCidades} onClick={importarCidades} icon={rodandoCidades ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}>
                {rodandoCidades ? "Importando..." : "Importar cidades (todo o Brasil)"}
              </Button>
              {progressoCidades && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-700">
                  {rodandoCidades ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {progressoCidades.feito}/{progressoCidades.total} estados — {progressoCidades.criadas} cidades novas criadas até agora
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <HomeIcon size={18} />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-ink-900">Bairros</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                Importa os bairros oficiais de Belém e Castanhal, e uma lista de Ananindeua (essa última sem lei
                municipal consolidada encontrada — pode ter alguma divergência pontual, dá pra ajustar depois aqui
                no admin). Marabá e Santarém ficaram de fora por não termos achado uma lista oficial confiável.
              </p>
              <Button size="sm" className="mt-3" disabled={rodandoBairros} onClick={importarBairros} icon={rodandoBairros ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}>
                {rodandoBairros ? "Importando..." : "Importar bairros"}
              </Button>
              {resultadoBairros && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-700">
                  <CheckCircle2 size={14} /> {resultadoBairros}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
