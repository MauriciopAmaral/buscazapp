import Link from "next/link";
import { Building2, Search } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Tela mostrada quando o usuário logado (papel "empresa") ainda não está
 * vinculado a nenhuma Company no banco — ou porque acabou de criar a conta,
 * ou porque uma reivindicação ainda não foi aprovada por um admin.
 */
export function NoCompanyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-ink-300 bg-ink-50/60 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
        <Building2 size={22} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-ink-900">Sua conta ainda não tem uma empresa</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        Cadastre sua empresa agora pra começar a usar o painel — ou, se o seu negócio já aparece no
        BuscaZapp, reivindique esse perfil em vez de criar um duplicado.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2">
        <Link href="/painel/criar-empresa" className="w-full">
          <Button fullWidth icon={<Building2 size={16} />}>
            Cadastrar minha empresa agora
          </Button>
        </Link>
        <Link href="/buscar" className="w-full">
          <Button variant="outline" fullWidth icon={<Search size={16} />}>
            Procurar e reivindicar um perfil existente
          </Button>
        </Link>
      </div>
    </div>
  );
}
