import { coupons, getCouponsByCompany } from "@/mocks/coupons";
import { Coupon } from "@/types";

export const couponService = {
  async list(): Promise<Coupon[]> {
    return Promise.resolve(coupons);
  },
  async getByCompany(companyId: string): Promise<Coupon[]> {
    return Promise.resolve(getCouponsByCompany(companyId));
  },
  async redeem(couponId: string): Promise<{ codigo: string }> {
    const coupon = coupons.find((c) => c.id === couponId);
    return Promise.resolve({ codigo: coupon?.codigo ?? "INVALIDO" });
  },
};
