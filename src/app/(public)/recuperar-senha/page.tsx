"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, KeyRound } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ mensagem: string; resetUrl: string | null } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErro(json?.error?.message ?? "Não foi possível gerar o link. Tente novamente.");
        return;
      }
      setResultado({
        mensagem: json.data.message,
        resetUrl: json.data.resetToken
          ? `${window.location.origin}/redefinir-senha/${json.data.resetToken}`
          : null,
      });
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
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Esqueceu sua senha?</h1>
      <p className="mt-1 text-center text-sm text-ink-500">
        Informe o e-mail da sua conta — vamos gerar um link pra você criar uma senha nova.
      </p>

      {resultado ? (
        <div className="mt-8 w-full rounded-2xl border border-ink-200 bg-white p-5 text-center">
          <p className="text-sm text-ink-700">{resultado.mensagem}</p>
          {resultado.resetUrl ? (
            <Link
              href={resultado.resetUrl.replace(window.location.origin, "")}
              className="mt-4 inline-block break-all rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 underline"
            >
              {resultado.resetUrl}
            </Link>
          ) : null}
        </div>
      ) : (
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
          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {erro}
            </p>
          )}
          <Button type="submit" fullWidth size="lg" disabled={carregando}>
            {carregando ? "Gerando link..." : "Enviar link de redefinição"}
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
