"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, KeyRound } from "lucide-react";
import { Button, Input } from "@/components/ui";

export function RedefinirSenhaClient({ token }: { token: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha: senha }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível redefinir a senha.");
        return;
      }
      setSucesso(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 sm:px-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
        <KeyRound size={22} />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Criar nova senha</h1>
      <p className="mt-1 text-center text-sm text-ink-500">Escolha uma senha nova para a sua conta.</p>

      {sucesso ? (
        <div className="mt-8 w-full rounded-2xl border border-ink-200 bg-white p-5 text-center">
          <p className="text-sm text-ink-700">Senha atualizada! Redirecionando para o login...</p>
        </div>
      ) : (
        <form className="mt-8 flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Nova senha"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            hint="Mínimo de 6 caracteres."
            required
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />
          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {erro}
            </p>
          )}
          <Button type="submit" fullWidth size="lg" disabled={carregando}>
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-500">
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
