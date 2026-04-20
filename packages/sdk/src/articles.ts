import { ZoraApiError, type ZoraClient } from "./client.js";
import type {
  Article,
  ArticleInput,
  ArticleListQuery,
  Paginated,
} from "./types.js";

export class ArticlesApi {
  constructor(private readonly client: ZoraClient) {}

  list(query: ArticleListQuery = {}): Promise<Paginated<Article>> {
    return this.client.get<Paginated<Article>>("/admin/articles", {
      status: query.status,
      sort: query.sort,
      order: query.order,
      limit: query.limit,
      offset: query.offset,
      search: query.search,
    });
  }

  get(id: number): Promise<Article> {
    return this.client.get<Article>(`/admin/articles/${id}`);
  }

  /**
   * 先尝试调用 /admin/articles/by-slug/:slug（后端 >= 0.2）；
   * 若端点不存在（404 且不是"文章不存在"），退回分页扫描保持兼容。
   */
  async getBySlug(slug: string): Promise<Article | null> {
    try {
      return await this.client.get<Article>(`/admin/articles/by-slug/${encodeURIComponent(slug)}`);
    } catch (err) {
      if (err instanceof ZoraApiError && err.code === 404) {
        // 区分：后端消息是"文章不存在" = 真的没有；其他 404 = 端点未部署
        if (typeof err.message === "string" && err.message.includes("文章不存在")) {
          return null;
        }
        return this.getBySlugByScan(slug);
      }
      throw err;
    }
  }

  private async getBySlugByScan(slug: string): Promise<Article | null> {
    const limit = 100;
    let offset = 0;
    while (true) {
      const page = await this.list({ limit, offset, status: "all" });
      const found = page.items.find((a) => a.slug === slug);
      if (found) return found;
      offset += page.items.length;
      if (page.items.length === 0 || offset >= page.pagination.total) return null;
    }
  }

  create(input: ArticleInput): Promise<Article> {
    return this.client.post<Article>("/admin/articles", input);
  }

  update(id: number, input: ArticleInput): Promise<Article> {
    return this.client.put<Article>(`/admin/articles/${id}`, input);
  }

  delete(id: number): Promise<void> {
    return this.client.delete<void>(`/admin/articles/${id}`);
  }

  publish(id: number): Promise<Article> {
    return this.update(id, { status: "published" });
  }

  unpublish(id: number): Promise<Article> {
    return this.update(id, { status: "draft" });
  }
}
