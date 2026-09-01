import { DataTable, Badge } from "@/components/ui";
import { users } from "@/mocks/users";
import { formatDate } from "@/lib/utils";

const roleVariant = { consumidor: "ink", empresa: "brand", admin: "gold" } as const;
const roleLabel = { consumidor: "Consumidor", empresa: "Empresa", admin: "Admin" } as const;

export default function UsuariosPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Usuários</h1>
      <p className="text-sm text-ink-500">{users.length} contas cadastradas na plataforma.</p>

      <div className="mt-4">
        <DataTable
          data={users}
          rowKey={(u) => u.id}
          columns={[
            { key: "nome", header: "Nome", render: (u) => <span className="font-medium text-ink-900">{u.nome}</span> },
            { key: "email", header: "E-mail", render: (u) => u.email },
            { key: "tipo", header: "Tipo", render: (u) => <Badge variant={roleVariant[u.role]}>{roleLabel[u.role]}</Badge> },
            { key: "criadoEm", header: "Cadastrado em", render: (u) => formatDate(u.criadoEm) },
          ]}
        />
      </div>
    </div>
  );
}
