import { ZoraClient, type ZoraClientOptions } from "./client.js";
import { ArticlesApi } from "./articles.js";
import { CategoriesApi } from "./categories.js";
import { TagsApi } from "./tags.js";
import { TopicsApi } from "./topics.js";
import { CommentsApi } from "./comments.js";
import { UploadsApi } from "./upload.js";
import { AuthApi } from "./auth.js";
import { AnalyticsApi } from "./analytics.js";

export * from "./types.js";
export { ZoraClient, ZoraApiError } from "./client.js";
export type { ZoraClientOptions, RequestOptions } from "./client.js";
export { ArticlesApi } from "./articles.js";
export { CategoriesApi } from "./categories.js";
export { TagsApi } from "./tags.js";
export { TopicsApi } from "./topics.js";
export { CommentsApi } from "./comments.js";
export { UploadsApi, type UploadInput } from "./upload.js";
export { AuthApi, type MeResponse } from "./auth.js";
export {
  AnalyticsApi,
  type AnalyticsRangeKey,
  type AnalyticsRangeQuery,
  type OverviewResponse,
  type TimelinePoint,
  type TopArticleStat,
  type CategoryStat,
  type TopicStat,
  type ReferrerStat,
  type UtmStat,
  type EntryPageStat,
  type GeoCountryStat,
  type GeoRegionStat,
  type DeviceStat,
  type VisitorBreakdown,
  type PublishTimeStat,
} from "./analytics.js";
export * as markdown from "./markdown/index.js";

export class ZoraBlog {
  readonly client: ZoraClient;
  readonly auth: AuthApi;
  readonly articles: ArticlesApi;
  readonly categories: CategoriesApi;
  readonly tags: TagsApi;
  readonly topics: TopicsApi;
  readonly comments: CommentsApi;
  readonly uploads: UploadsApi;
  readonly analytics: AnalyticsApi;

  constructor(options: ZoraClientOptions) {
    this.client = new ZoraClient(options);
    this.auth = new AuthApi(this.client);
    this.articles = new ArticlesApi(this.client);
    this.categories = new CategoriesApi(this.client);
    this.tags = new TagsApi(this.client);
    this.topics = new TopicsApi(this.client);
    this.comments = new CommentsApi(this.client);
    this.uploads = new UploadsApi(this.client);
    this.analytics = new AnalyticsApi(this.client);
  }
}
