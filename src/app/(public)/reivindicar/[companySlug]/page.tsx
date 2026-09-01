import { notFound } from "next/navigation";
import { companies, getCompanyBySlug } from "@/mocks/companies";
import { ReivindicarWizard } from "./ReivindicarWizard";

export function generateStaticParams() {
  return companies.map((c) => ({ companySlug: c.slug }));
}

export default async function ReivindicarCompanyPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const company = getCompanyBySlug(companySlug);
  if (!company) notFound();

  return <ReivindicarWizard company={company} />;
}
