import { categories, getCategoryBySlug } from "@/mocks/categories";
import { Category } from "@/types";

export const categoryService = {
  async list(): Promise<Category[]> {
    return Promise.resolve(categories);
  },
  async getBySlug(slug: string): Promise<Category | undefined> {
    return Promise.resolve(getCategoryBySlug(slug));
  },
};
