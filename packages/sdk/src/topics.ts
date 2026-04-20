import type { ZoraClient } from "./client.js";
import type { Topic, TopicInput } from "./types.js";

export class TopicsApi {
  constructor(private readonly client: ZoraClient) {}

  list(): Promise<Topic[]> {
    return this.client.get<Topic[]>("/admin/topics");
  }

  get(id: number): Promise<Topic> {
    return this.client.get<Topic>(`/admin/topics/${id}`);
  }

  create(input: TopicInput): Promise<Topic> {
    return this.client.post<Topic>("/admin/topics", input);
  }

  update(id: number, input: TopicInput): Promise<Topic> {
    return this.client.put<Topic>(`/admin/topics/${id}`, input);
  }

  delete(id: number): Promise<void> {
    return this.client.delete<void>(`/admin/topics/${id}`);
  }
}
