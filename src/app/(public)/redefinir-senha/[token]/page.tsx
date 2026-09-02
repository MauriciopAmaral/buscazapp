import { RedefinirSenhaClient } from "./RedefinirSenhaClient";

export const metadata = { title: "Criar nova senha — BuscaZapp" };

export default async function RedefinirSenhaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <RedefinirSenhaClient token={token} />;
}
