"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2Off, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { DataTable, Badge, Select, LoadingState, SearchInput, Modal, Input, Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";

export default function UsuariosPage() {
  const { token, user: usuarioLogado } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [termo, setTermo] = useState("");
  const [alterando, setAlterando] = useState<string | null>(null);
  const [editando, setEditando] = useState<User | null>(null);

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

  const salvarEdicao = async (payload: { nome: string; email: string; novaSenha: string }) => {
    if (!token || !editando) return { erro: "Sessão expirada." };
    const body: Record<string, string> = { nome: payload.nome, email: payload.email };
    if (payload.novaSenha) body.novaSenha = payload.novaSenha;
    const res = await fetch(`/api/admin/users/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { erro: json?.error?.message ?? "Não foi possível salvar." };
    }
    setUsers((prev) => prev.map((u) => (u.id === json.data.id ? json.data : u)));
    setEditando(null);
    return {};
  };

  const excluir = async (u: User) => {
    if (!token) return;
    if (!confirm(`Excluir a conta de "${u.nome}" (${u.email}) definitivamente? Não dá pra desfazer.`)) return;
    setAlterando(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
      } else {
        alert(json?.error?.message ?? "Não foi possível excluir essa conta.");
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
              {
                key: "acoes",
                header: "Ações",
                render: (u) => (
                  <div className="flex items-center gap-2">
                    <button
                      title="Editar"
                      disabled={alterando === u.id}
                      onClick={() => setEditando(u)}
                      className="text-ink-500 hover:text-brand-700 disabled:opacity-40"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      title={u.id === usuarioLogado?.id ? "Não é possível excluir a própria conta" : "Excluir"}
                      disabled={alterando === u.id || u.id === usuarioLogado?.id}
                      onClick={() => excluir(u)}
                      className="text-ink-500 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar usuário">
        {editando && <EditarUsuarioForm usuario={editando} onSave={salvarEdicao} />}
      </Modal>
    </div>
  );
}

function EditarUsuarioForm({
  usuario,
  onSave,
}: {
  usuario: User;
  onSave: (payload: { nome: string; email: string; novaSenha: string }) => Promise<{ erro?: string }>;
}) {
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [novaSenha, setNovaSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (novaSenha && novaSenha.length < 6) {
          setErro("A nova senha precisa ter pelo menos 6 caracteres.");
          return;
        }
        setSaving(true);
        setErro(null);
        try {
          const resultado = await onSave({ nome, email, novaSenha });
          if (resultado.erro) setErro(resultado.erro);
        } finally {
          setSaving(false);
        }
      }}
    >
      <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input
        label="Nova senha (opcional)"
        type="password"
        value={novaSenha}
        onChange={(e) => setNovaSenha(e.target.value)}
        placeholder="Deixe em branco pra manter a senha atual"
        hint={'Mínimo de 6 caracteres. Use isso quando a pessoa perdeu acesso e não pode usar o "esqueci minha senha".'}
      />
      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}
      <Button type="submit" fullWidth disabled={saving}>
        {saving ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
