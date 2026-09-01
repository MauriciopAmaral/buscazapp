import { products, services, getProductsByCompany, getServicesByCompany } from "@/mocks/offerings";
import { Product, Service } from "@/types";

export const offeringService = {
  async productsByCompany(companyId: string): Promise<Product[]> {
    return Promise.resolve(getProductsByCompany(companyId));
  },
  async servicesByCompany(companyId: string): Promise<Service[]> {
    return Promise.resolve(getServicesByCompany(companyId));
  },
  async allProducts(): Promise<Product[]> {
    return Promise.resolve(products);
  },
  async allServices(): Promise<Service[]> {
    return Promise.resolve(services);
  },
};
