import type { ZoraClient } from "./client.js";
import type { Tag, TagInput } from "./types.js";

export class TagsApi {
  constructor(private readonly client: ZoraClient) {}

  list(): Promise<Tag[]> {
    return this.client.get<Tag[]>("/admin/tags");
  }

  create(input: TagInput): Promise<Tag> {
    return this.client.post<Tag>("/admin/tags", input);
  }

  update(id: number, input: Partial<TagInput>): Promise<Tag> {
    return this.client.put<Tag>(`/admin/tags/${id}`, input);
  }

  delete(id: number): Promise<void> {
    return this.client.delete<void>(`/admin/tags/${id}`);
  }
}
