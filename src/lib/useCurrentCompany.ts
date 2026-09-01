"use client";

import { useAuth } from "@/context/AuthContext";
import { companies } from "@/mocks/companies";

export function useCurrentCompany() {
  const { user } = useAuth();
  return companies.find((c) => c.id === user?.companyId) ?? companies[0];
}
