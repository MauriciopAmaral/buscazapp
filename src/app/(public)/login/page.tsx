"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { Button, Input, LinkButton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const result = await login(email, senha);
    setCarregando(false);
    if (!result.ok) {
      setErro(result.error);
      return;
    }
    // O papel do usuário só é conhecido depois do login — pega da resposta salva no contexto.
    router.push("/minha-conta");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 sm:px-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
        B
      </span>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Entrar no BuscaZapp</h1>
      <p className="mt-1 text-sm text-ink-500">Acesse sua conta para favoritar empresas e resgatar cupons.</p>

      <form className="mt-8 flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          icon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <Link href="/recuperar-senha" className="-mt-2 self-end text-xs font-medium text-brand-700 hover:underline">
          Esqueceu sua senha?
        </Link>
        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {erro}
          </p>
        )}
        <Button type="submit" fullWidth size="lg" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-ink-500">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand-700 hover:underline">
          Cadastre-se
        </Link>
      </p>

      <LinkButton href="/" variant="ghost" size="sm" className="mt-6">
        Voltar para a Home
      </LinkButton>
    </div>
  );
}
