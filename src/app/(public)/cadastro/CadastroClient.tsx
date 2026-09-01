"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, User2, Building2, ShieldCheck } from "lucide-react";
import { Button, Input, LinkButton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function CadastroClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginAs } = useAuth();
  const [tipo, setTipo] = useState<"consumidor" | "empresa">(
    searchParams.get("tipo") === "empresa" ? "empresa" : "consumidor"
  );

  const devLogin = (role: "consumidor" | "empresa" | "admin") => {
    loginAs(role);
    router.push(role === "empresa" ? "/painel" : role === "admin" ? "/admin" : "/minha-conta");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 sm:px-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
        B
      </span>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Criar conta</h1>
      <p className="mt-1 text-center text-sm text-ink-500">
        Escolha o tipo de conta e comece a usar o BuscaZapp.
      </p>

      <div className="mt-6 grid w-full grid-cols-2 gap-2 rounded-xl bg-ink-100 p-1">
        <button
          onClick={() => setTipo("consumidor")}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            tipo === "consumidor" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
          )}
        >
          Sou consumidor
        </button>
        <button
          onClick={() => setTipo("empresa")}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            tipo === "empresa" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
          )}
        >
          Sou empresa
        </button>
      </div>

      <form
        className="mt-6 flex w-full flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          devLogin(tipo);
        }}
      >
        <Input label="Nome completo" placeholder="Seu nome" icon={<User2 size={16} />} required />
        <Input label="E-mail" type="email" placeholder="voce@email.com" icon={<Mail size={16} />} required />
        <Input label="Senha" type="password" placeholder="••••••••" icon={<Lock size={16} />} required />
        <Button type="submit" fullWidth size="lg">
          {tipo === "empresa" ? "Criar conta e cadastrar empresa" : "Criar conta"}
        </Button>
      </form>

      <div className="mt-10 w-full rounded-2xl border border-dashed border-ink-300 bg-ink-50/60 p-4">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">
          Atalhos de desenvolvimento — protótipo
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="outline" fullWidth icon={<User2 size={16} />} onClick={() => devLogin("consumidor")}>
            Entrar como consumidor
          </Button>
          <Button variant="outline" fullWidth icon={<Building2 size={16} />} onClick={() => devLogin("empresa")}>
            Entrar como empresa
          </Button>
          <Button variant="outline" fullWidth icon={<ShieldCheck size={16} />} onClick={() => devLogin("admin")}>
            Entrar como administrador
          </Button>
        </div>
      </div>

      <LinkButton href="/" variant="ghost" size="sm" className="mt-4">
        Voltar para a Home
      </LinkButton>
    </div>
  );
}
