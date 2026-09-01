"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2, Mail, Phone, FileText, ShieldCheck, ArrowRight,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { Company } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type Step = "confirmar" | "conta" | "validacao" | "codigo" | "enviado";

const steps: { key: Step; label: string }[] = [
  { key: "confirmar", label: "Confirmar" },
  { key: "conta", label: "Conta" },
  { key: "validacao", label: "Validação" },
  { key: "codigo", label: "Código" },
  { key: "enviado", label: "Enviado" },
];

export function ReivindicarWizard({ company }: { company: Company }) {
  const router = useRouter();
  const { register, token } = useAuth();
  const [step, setStep] = useState<Step>("confirmar");
  const [metodo, setMetodo] = useState<"email" | "telefone" | "documento">("email");
  const [codigo, setCodigo] = useState("");
  const stepIndex = steps.findIndex((s) => s.key === step);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroConta, setErroConta] = useState<string | null>(null);
  const [criandoConta, setCriandoConta] = useState(false);
  const [enviandoClaim, setEnviandoClaim] = useState(false);
  const [erroClaim, setErroClaim] = useState<string | null>(null);

  const criarContaEContinuar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroConta(null);
    setCriandoConta(true);
    const result = await register(nome, email, senha, "empresa");
    setCriandoConta(false);
    if (!result.ok) {
      setErroConta(result.error);
      return;
    }
    setStep("validacao");
  };

  const confirmarCodigoEEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroClaim(null);
    setEnviandoClaim(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ companySlug: company.slug, metodo }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErroClaim(json?.error?.message ?? "Não foi possível enviar a reivindicação. Tente de novo.");
        return;
      }
      setStep("enviado");
    } finally {
      setEnviandoClaim(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      {/* Stepper */}
      <div className="mb-8 flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i <= stepIndex ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-400"
              )}
            >
              {i < stepIndex ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("mx-1 h-0.5 flex-1", i < stepIndex ? "bg-brand-600" : "bg-ink-100")} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-ink-100">
            <Image src={company.logoUrl} alt="" fill className="object-cover" unoptimized />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">{company.nomeFantasia}</p>
            <p className="text-xs text-ink-500">{company.categoriaNome} · {company.endereco.cidade}</p>
          </div>
        </div>

        {step === "confirmar" && (
          <div>
            <h2 className="text-lg font-bold text-ink-900">Você é o proprietário desta empresa?</h2>
            <p className="mt-1 text-sm text-ink-500">
              Ao confirmar, você iniciará o processo de reivindicação deste perfil no BuscaZapp.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" fullWidth onClick={() => router.push(`/empresa/${company.slug}`)}>
                Não, voltar
              </Button>
              <Button fullWidth onClick={() => setStep("conta")}>
                Sim, sou o proprietário
              </Button>
            </div>
          </div>
        )}

        {step === "conta" && (
          <form onSubmit={criarContaEContinuar}>
            <h2 className="text-lg font-bold text-ink-900">Crie sua conta de empresa</h2>
            <p className="mt-1 text-sm text-ink-500">Você usará esta conta para acessar o painel.</p>
            <div className="mt-5 flex flex-col gap-4">
              <Input
                label="Seu nome"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
              <Input
                label="E-mail"
                type="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                hint="Mínimo de 6 caracteres."
                required
              />
            </div>
            {erroConta && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {erroConta}
              </p>
            )}
            <Button type="submit" fullWidth className="mt-6" disabled={criandoConta}>
              {criandoConta ? "Criando conta..." : "Continuar"}
            </Button>
          </form>
        )}

        {step === "validacao" && (
          <div>
            <h2 className="text-lg font-bold text-ink-900">Escolha o método de validação</h2>
            <p className="mt-1 text-sm text-ink-500">Vamos confirmar que você administra esta empresa.</p>
            <div className="mt-5 flex flex-col gap-2">
              {[
                { key: "email" as const, label: `E-mail — ${company.email ?? "contato@empresa.com"}`, icon: <Mail size={16} /> },
                { key: "telefone" as const, label: `Telefone — ${company.telefone}`, icon: <Phone size={16} /> },
                { key: "documento" as const, label: "Envio de documento (CNPJ)", icon: <FileText size={16} /> },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setMetodo(opt.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left text-sm",
                    metodo === opt.key ? "border-brand-500 bg-brand-50/60 text-brand-800" : "border-ink-200 text-ink-700 hover:bg-ink-50"
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
            <Button fullWidth className="mt-6" onClick={() => setStep("codigo")}>
              Enviar código de validação
            </Button>
          </div>
        )}

        {step === "codigo" && (
          <form onSubmit={confirmarCodigoEEnviar}>
            <h2 className="text-lg font-bold text-ink-900">Digite o código recebido</h2>
            <p className="mt-1 text-sm text-ink-500">
              Enviamos um código fictício de 6 dígitos (o envio de SMS/e-mail de verdade ainda não existe neste
              protótipo). Use <strong>123456</strong>.
            </p>
            <Input
              label="Código de verificação"
              placeholder="123456"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              maxLength={6}
              className="mt-5 text-center tracking-[0.5em]"
              required
            />
            {erroClaim && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {erroClaim}
              </p>
            )}
            <Button type="submit" fullWidth className="mt-6" icon={<ShieldCheck size={16} />} disabled={enviandoClaim}>
              {enviandoClaim ? "Enviando..." : "Confirmar código"}
            </Button>
          </form>
        )}

        {step === "enviado" && (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <CheckCircle2 size={26} />
            </span>
            <h2 className="mt-4 text-lg font-bold text-ink-900">Solicitação enviada!</h2>
            <p className="mt-1 text-sm text-ink-500">
              Sua reivindicação foi registrada e está aguardando aprovação da nossa equipe. Você já pode acessar o
              painel — o acesso completo aos dados desta empresa libera assim que a reivindicação for aprovada.
            </p>
            <Button className="mt-6" onClick={() => router.push("/painel")} iconRight={<ArrowRight size={16} />}>
              Acessar meu painel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
