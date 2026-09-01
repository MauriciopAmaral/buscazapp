"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SearchInput } from "@/components/ui";
import { companies } from "@/mocks/companies";
import { Company } from "@/types";
import Image from "next/image";
import Link from "next/link";

export function ReivindicarClient() {
  const router = useRouter();
  const [termo, setTermo] = useState("");

  const results: Company[] = termo
    ? companies.filter((c) => c.nomeFantasia.toLowerCase().includes(termo.toLowerCase()))
    : companies.slice(0, 8);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Reivindicar minha empresa</h1>
      <p className="mt-1 text-sm text-ink-500">
        Encontre sua empresa no BuscaZapp para assumir a administração do perfil.
      </p>

      <div className="mt-6">
        <SearchInput
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Digite o nome da sua empresa..."
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {results.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/reivindicar/${c.slug}`)}
            className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 text-left hover:border-brand-300 hover:bg-brand-50/40"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-100">
              <Image src={c.logoUrl} alt="" fill className="object-cover" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-ink-900">{c.nomeFantasia}</p>
              <p className="text-xs text-ink-500">
                {c.categoriaNome} · {c.endereco.cidade}
              </p>
            </div>
            {c.reivindicada && (
              <span className="text-xs font-medium text-ink-400">Já reivindicada</span>
            )}
          </button>
        ))}
        {results.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-400">
            Nenhuma empresa encontrada.{" "}
            <Search size={12} className="inline" />
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        Não encontrou sua empresa?{" "}
        <Link href="/cadastro?tipo=empresa" className="font-medium text-brand-700 hover:underline">
          Cadastre-a agora
        </Link>
      </p>
    </div>
  );
}
