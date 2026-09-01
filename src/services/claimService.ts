import { claims, prospects, ads } from "@/mocks/claims";
import { Claim, Prospect, Ad } from "@/types";

export const claimService = {
  async list(): Promise<Claim[]> {
    return Promise.resolve(claims);
  },
  async updateStatus(claimId: string, status: Claim["status"]): Promise<void> {
    const claim = claims.find((c) => c.id === claimId);
    if (claim) claim.status = status;
    return Promise.resolve();
  },
};

export const prospectService = {
  async list(): Promise<Prospect[]> {
    return Promise.resolve(prospects);
  },
  async updateStatus(prospectId: string, status: Prospect["status"]): Promise<void> {
    const prospect = prospects.find((p) => p.id === prospectId);
    if (prospect) prospect.status = status;
    return Promise.resolve();
  },
};

export const adService = {
  async list(): Promise<Ad[]> {
    return Promise.resolve(ads);
  },
};
