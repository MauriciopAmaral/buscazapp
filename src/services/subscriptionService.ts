import { planos, subscriptions, payments, getSubscriptionByCompany, getPaymentsByCompany } from "@/mocks/subscriptions";
import { Plano, Subscription, Payment } from "@/types";

export const subscriptionService = {
  async listPlans(): Promise<Plano[]> {
    return Promise.resolve(planos);
  },
  async all(): Promise<Subscription[]> {
    return Promise.resolve(subscriptions);
  },
  async getByCompany(companyId: string): Promise<Subscription | undefined> {
    return Promise.resolve(getSubscriptionByCompany(companyId));
  },
  async paymentsByCompany(companyId: string): Promise<Payment[]> {
    return Promise.resolve(getPaymentsByCompany(companyId));
  },
};
