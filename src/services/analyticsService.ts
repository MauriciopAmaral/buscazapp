import { companyAnalytics, getAnalyticsByCompany, leads, getLeadsByCompany } from "@/mocks/analytics";
import { CompanyAnalytics, Lead } from "@/types";

export const analyticsService = {
  async getByCompany(companyId: string): Promise<CompanyAnalytics | undefined> {
    return Promise.resolve(getAnalyticsByCompany(companyId));
  },
  async leadsByCompany(companyId: string): Promise<Lead[]> {
    return Promise.resolve(getLeadsByCompany(companyId));
  },
  async all(): Promise<CompanyAnalytics[]> {
    return Promise.resolve(companyAnalytics);
  },
  async allLeads(): Promise<Lead[]> {
    return Promise.resolve(leads);
  },
};
