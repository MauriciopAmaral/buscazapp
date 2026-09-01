import { User } from "@/types";
import { companies } from "./companies";
import { legacyProvider } from "./legacyCompanies";

export const users: User[] = [
  {
    id: "user-consumidor-1",
    nome: "Maria Eduarda",
    email: "maria.eduarda@email.com",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    role: "consumidor",
    criadoEm: "2025-03-12T10:00:00.000Z",
    saldoCashback: 42.5,
    clubeAssinante: true,
  },
  {
    id: "user-empresa-1",
    nome: "Marcos Titan",
    email: "marcos@pizzariatitan.com.br",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    role: "empresa",
    companyId: companies[0].id,
    criadoEm: "2024-11-05T10:00:00.000Z",
  },
  {
    // Dono real (banco antigo) das 6 empresas importadas — ver
    // src/mocks/legacyCompanies.ts. Vinculado só à primeira por enquanto,
    // já que hoje o modelo só suporta 1 empresa por conta.
    id: "user-legacy-provider-1",
    nome: legacyProvider.nome,
    email: legacyProvider.email,
    role: "empresa",
    companyId: companies.find((c) => c.id === "legacy-1")?.id,
    criadoEm: legacyProvider.criadoEm,
  },
  {
    id: "user-admin-1",
    nome: "Equipe BuscaZapp",
    email: "admin@buscazapp.com.br",
    avatarUrl: "https://i.pravatar.cc/150?img=68",
    role: "admin",
    criadoEm: "2024-01-01T10:00:00.000Z",
  },
  ...companies.slice(1, 12).map((c, i) => ({
    id: `user-cliente-${i + 2}`,
    nome: [
      "Ana Souza", "Carlos Lima", "Mariana Costa", "João Pereira", "Fernanda Alves",
      "Ricardo Santos", "Juliana Rocha", "Pedro Nogueira", "Camila Ferreira", "Lucas Martins", "Patrícia Gomes",
    ][i],
    email: `usuario${i + 2}@email.com`,
    avatarUrl: `https://i.pravatar.cc/150?img=${i + 20}`,
    role: "consumidor" as const,
    criadoEm: new Date(2025, i % 12, (i % 27) + 1).toISOString(),
  })),
];

export function getCurrentUserMock(role: User["role"]) {
  return users.find((u) => u.role === role)!;
}
