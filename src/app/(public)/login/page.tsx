"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User2, Building2, ShieldCheck } from "lucide-react";
import { Button, Input, LinkButton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginAs } = useAuth();

  const devLogin = (role: "consumidor" | "empresa" | "admin") => {
    loginAs(role);
    router.push(role === "empresa" ? "/painel" : role === "admin" ? "/admin" : "/minha-conta");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 sm:px-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
        B
      </span>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Entrar no BuscaZapp</h1>
      <p className="mt-1 text-sm text-ink-500">Acesse sua conta para favoritar empresas e resgatar cupons.</p>

      <form
        className="mt-8 flex w-full flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          devLogin("consumidor");
        }}
      >
        <Input label="E-mail" type="email" placeholder="voce@email.com" icon={<Mail size={16} />} required />
        <Input label="Senha" type="password" placeholder="••••••••" icon={<Lock size={16} />} required />
        <Button type="submit" fullWidth size="lg">
          Entrar
        </Button>
      </form>

      <p className="mt-4 text-sm text-ink-500">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand-700 hover:underline">
          Cadastre-se
        </Link>
      </p>

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
