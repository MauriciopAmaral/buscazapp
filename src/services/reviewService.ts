import { reviews, getReviewsByCompany } from "@/mocks/reviews";
import { Review } from "@/types";

export const reviewService = {
  async getByCompany(companyId: string): Promise<Review[]> {
    return Promise.resolve(getReviewsByCompany(companyId));
  },
  async reply(reviewId: string, texto: string): Promise<Review | undefined> {
    const review = reviews.find((r) => r.id === reviewId);
    if (review) {
      review.resposta = { texto, data: new Date().toISOString() };
    }
    return Promise.resolve(review);
  },
};
