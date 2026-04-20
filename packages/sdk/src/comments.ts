import type { ZoraClient } from "./client.js";
import type {
  Comment,
  CommentListQuery,
  CommentListResponse,
  CommentStatus,
} from "./types.js";

export class CommentsApi {
  constructor(private readonly client: ZoraClient) {}

  list(query: CommentListQuery = {}): Promise<CommentListResponse> {
    return this.client.get<CommentListResponse>("/admin/comments", {
      status: query.status,
      articleId: query.articleId,
      limit: query.limit,
      offset: query.offset,
      search: query.search,
    });
  }

  moderate(id: number, action: Exclude<CommentStatus, "pending">): Promise<Comment> {
    return this.client.put<Comment>(`/admin/comments/${id}`, { status: action });
  }

  batchModerate(
    ids: number[],
    action: Exclude<CommentStatus, "pending">,
  ): Promise<{ updated: number }> {
    return this.client.put<{ updated: number }>("/admin/comments/batch", {
      ids,
      status: action,
    });
  }

  delete(id: number): Promise<void> {
    return this.client.delete<void>(`/admin/comments/${id}`);
  }
}
