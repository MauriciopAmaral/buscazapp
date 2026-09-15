import { notFound } from "next/navigation";
import { getCompanyDetailBySlug } from "@/lib/companyData";
import { ReivindicarWizard } from "./ReivindicarWizard";

// Sem `generateStaticParams`: a lista de empresas muda o tempo todo (novos
// cadastros, planos comprados etc.), então essa página é renderizada sob
// demanda a partir do banco de verdade em vez de pré-gerada no build.
export default async function ReivindicarCompanyPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const company = await getCompanyDetailBySlug(companySlug);
  if (!company) notFound();

  return <ReivindicarWizard company={company} />;
}
