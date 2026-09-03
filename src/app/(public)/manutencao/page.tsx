import { Wrench } from "lucide-react";
import { getOrCreateSettings } from "@/lib/settings";

export default async function ManutencaoPage() {
  const settings = await getOrCreateSettings();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Wrench size={28} />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-ink-900">{settings.nomePlataforma} está em manutenção</h1>
      <p className="mt-2 text-sm text-ink-500">
        Estamos fazendo alguns ajustes por aqui. Volte em instantes — já já está tudo funcionando de novo.
      </p>
      <p className="mt-4 text-xs text-ink-400">
        Precisa de ajuda urgente? Fale com a gente em{" "}
        <a href={`mailto:${settings.emailSuporte}`} className="font-medium text-brand-600 hover:underline">
          {settings.emailSuporte}
        </a>
        .
      </p>
    </div>
  );
}
