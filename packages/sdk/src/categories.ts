import type { ZoraClient } from "./client.js";
import type { Category, CategoryInput } from "./types.js";

export class CategoriesApi {
  constructor(private readonly client: ZoraClient) {}

  list(): Promise<Category[]> {
    return this.client.get<Category[]>("/admin/categories");
  }

  create(input: CategoryInput): Promise<Category> {
    return this.client.post<Category>("/admin/categories", input);
  }

  update(id: number, input: Partial<CategoryInput>): Promise<Category> {
    return this.client.put<Category>(`/admin/categories/${id}`, input);
  }

  delete(id: number): Promise<void> {
    return this.client.delete<void>(`/admin/categories/${id}`);
  }
}
