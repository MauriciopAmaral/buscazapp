import { promotions, getPromotionsByCompany } from "@/mocks/promotions";
import { Promotion } from "@/types";

export const promotionService = {
  async list(): Promise<Promotion[]> {
    return Promise.resolve(promotions);
  },
  async getByCompany(companyId: string): Promise<Promotion[]> {
    return Promise.resolve(getPromotionsByCompany(companyId));
  },
};
