"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2Off, ExternalLink } from "lucide-react";
import { DataTable, Badge, Select, LoadingState, SearchInput } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";

export default function UsuariosPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [termo, setTermo] = useState("");
  const [alterando, setAlterando] = useState<string | null>(null);

  const carregar = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setUsers(json.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega a lista assim que o token estiver disponível
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só precisa recarregar quando o token muda
  }, [token]);

  const alterarRole = async (id: string, role: string) => {
    if (!token) return;
    setAlterando(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setUsers((prev) => prev.map((u) => (u.id === id ? json.data : u)));
      }
    } finally {
      setAlterando(null);
    }
  };

  const desvincularEmpresa = async (id: string) => {
    if (!token) return;
    if (!confirm("Desvincular essa conta da empresa? A pessoa perde o acesso ao painel dela até uma nova reivindicação ser aprovada.")) return;
    setAlterando(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId: "" }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setUsers((prev) => prev.map((u) => (u.id === id ? json.data : u)));
      }
    } finally {
      setAlterando(null);
    }
  };

  const results = users.filter(
    (u) => !termo || u.nome.toLowerCase().includes(termo.toLowerCase()) || u.email.toLowerCase().includes(termo.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Usuários</h1>
      <p className="text-sm text-ink-500">{users.length} contas cadastradas na plataforma.</p>

      <div className="mt-4">
        <SearchInput value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por nome ou e-mail..." />
      </div>

      <div className="mt-4">
        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            data={results}
            rowKey={(u) => u.id}
            columns={[
              { key: "nome", header: "Nome", render: (u) => <span className="font-medium text-ink-900">{u.nome}</span> },
              { key: "email", header: "E-mail", render: (u) => u.email },
              {
                key: "tipo",
                header: "Tipo",
                render: (u) => (
                  <Select
                    value={u.role}
                    disabled={alterando === u.id}
                    onChange={(e) => alterarRole(u.id, e.target.value)}
                    className="!py-1.5 !text-xs"
                  >
                    <option value="consumidor">Consumidor</option>
                    <option value="empresa">Empresa</option>
                    <option value="admin">Admin</option>
                  </Select>
                ),
              },
              {
                key: "empresa",
                header: "Empresa vinculada",
                render: (u) =>
                  u.companyNome ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/empresa/${u.companySlug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                      >
                        {u.companyNome} <ExternalLink size={12} />
                      </Link>
                      <button
                        title="Desvincular"
                        disabled={alterando === u.id}
                        onClick={() => desvincularEmpresa(u.id)}
                        className="text-ink-400 hover:text-red-600"
                      >
                        <Link2Off size={14} />
                      </button>
                    </div>
                  ) : (
                    <Badge variant="outline">Nenhuma</Badge>
                  ),
              },
              { key: "criadoEm", header: "Cadastrado em", render: (u) => formatDate(u.criadoEm) },
            ]}
          />
        )}
      </div>
    </div>
  );
}
