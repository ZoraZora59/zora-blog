import type { ZoraClient } from "./client.js";

export type AnalyticsRangeKey = "today" | "7d" | "30d" | "90d" | "custom";

export interface AnalyticsRangeQuery {
  range?: AnalyticsRangeKey;
  /** YYYY-MM-DD，仅 range=custom 时必填 */
  from?: string;
  to?: string;
  limit?: number;
}

export interface OverviewResponse {
  range: { from: string; to: string };
  current: {
    pv: number;
    uv: number;
    sessions: number;
    newVisitors: number;
    bounceRate: number | null;
    avgPagesPerSession: number | null;
  };
  previous: OverviewResponse["current"] | null;
  delta: Record<string, string> | null;
}

export interface TimelinePoint {
  bucket: string;
  pv: number;
  uv: number;
  sessions?: number;
}

export interface TopArticleStat {
  articleId: number;
  article: { id: number; title: string; slug: string; publishedAt: string | null; status: string } | null;
  pv: number;
  uv: number;
}

export interface CategoryStat {
  categoryId: number;
  category: { id: number; name: string; slug: string } | null;
  pv: number;
  uv: number;
}

export interface TopicStat {
  topicId: number;
  topic: { id: number; title: string; slug: string } | null;
  pv: number;
  uv: number;
}

export interface ReferrerStat {
  host: string;
  type: "DIRECT" | "SEARCH" | "SOCIAL" | "EXTERNAL" | "INTERNAL";
  pv: number;
  uv: number;
}

export interface UtmStat {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  pv: number;
  uv: number;
}

export interface EntryPageStat {
  path: string;
  pv: number;
  uv: number;
}

export interface GeoCountryStat {
  country: string;
  pv: number;
  uv: number;
}

export interface GeoRegionStat extends GeoCountryStat {
  region: string;
}

export interface DeviceStat {
  device?: string;
  os?: string;
  browser?: string;
  pv: number;
  uv: number;
}

export interface VisitorBreakdown {
  uv: number;
  newVisitors: number;
  returningVisitors: number;
  sessions: number;
  avgPagesPerSession: number | null;
  bounceRate: number | null;
  newRatio: number;
}

export interface PublishTimeStat {
  articleId: number;
  title: string;
  slug: string;
  publishedAt: string;
  publishedHour: number;
  publishedWeekday: number;
  pv: number;
  uv: number;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function cleanQuery(query: QueryParams): QueryParams {
  const out: QueryParams = {};
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

export class AnalyticsApi {
  constructor(private readonly client: ZoraClient) {}

  overview(query: AnalyticsRangeQuery & { compare?: boolean } = {}): Promise<OverviewResponse> {
    return this.client.get<OverviewResponse>(
      "/admin/analytics/overview",
      cleanQuery({
        range: query.range,
        from: query.from,
        to: query.to,
        compare: query.compare ? "true" : undefined,
      }),
    );
  }

  timeline(
    query: AnalyticsRangeQuery & { granularity?: "hour" | "day" | "week" } = {},
  ): Promise<TimelinePoint[]> {
    return this.client.get<TimelinePoint[]>(
      "/admin/analytics/timeline",
      cleanQuery({
        range: query.range,
        from: query.from,
        to: query.to,
        granularity: query.granularity,
      }),
    );
  }

  topArticles(
    query: AnalyticsRangeQuery & { sort?: "pv" | "uv" } = {},
  ): Promise<TopArticleStat[]> {
    return this.client.get<TopArticleStat[]>(
      "/admin/analytics/articles",
      cleanQuery({
        range: query.range,
        from: query.from,
        to: query.to,
        limit: query.limit,
        sort: query.sort,
      }),
    );
  }

  articleTimeline(articleId: number, query: AnalyticsRangeQuery = {}): Promise<TimelinePoint[]> {
    return this.client.get<TimelinePoint[]>(
      `/admin/analytics/articles/${articleId}`,
      cleanQuery({ range: query.range, from: query.from, to: query.to }),
    );
  }

  categories(query: AnalyticsRangeQuery = {}): Promise<CategoryStat[]> {
    return this.client.get<CategoryStat[]>(
      "/admin/analytics/categories",
      cleanQuery({ range: query.range, from: query.from, to: query.to, limit: query.limit }),
    );
  }

  topics(query: AnalyticsRangeQuery = {}): Promise<TopicStat[]> {
    return this.client.get<TopicStat[]>(
      "/admin/analytics/topics",
      cleanQuery({ range: query.range, from: query.from, to: query.to, limit: query.limit }),
    );
  }

  sources(query: AnalyticsRangeQuery = {}): Promise<ReferrerStat[]> {
    return this.client.get<ReferrerStat[]>(
      "/admin/analytics/sources",
      cleanQuery({ range: query.range, from: query.from, to: query.to, limit: query.limit }),
    );
  }

  utm(query: AnalyticsRangeQuery = {}): Promise<UtmStat[]> {
    return this.client.get<UtmStat[]>(
      "/admin/analytics/utm",
      cleanQuery({ range: query.range, from: query.from, to: query.to, limit: query.limit }),
    );
  }

  entryPages(query: AnalyticsRangeQuery = {}): Promise<EntryPageStat[]> {
    return this.client.get<EntryPageStat[]>(
      "/admin/analytics/entry-pages",
      cleanQuery({ range: query.range, from: query.from, to: query.to, limit: query.limit }),
    );
  }

  geo(
    query: AnalyticsRangeQuery & { level?: "country" | "region" } = {},
  ): Promise<GeoCountryStat[] | GeoRegionStat[]> {
    return this.client.get(
      "/admin/analytics/geo",
      cleanQuery({
        range: query.range,
        from: query.from,
        to: query.to,
        limit: query.limit,
        level: query.level,
      }),
    );
  }

  devices(
    query: AnalyticsRangeQuery & { dimension?: "device" | "os" | "browser" } = {},
  ): Promise<DeviceStat[]> {
    return this.client.get<DeviceStat[]>(
      "/admin/analytics/devices",
      cleanQuery({
        range: query.range,
        from: query.from,
        to: query.to,
        limit: query.limit,
        dimension: query.dimension,
      }),
    );
  }

  visitors(query: AnalyticsRangeQuery = {}): Promise<VisitorBreakdown> {
    return this.client.get<VisitorBreakdown>(
      "/admin/analytics/visitors",
      cleanQuery({ range: query.range, from: query.from, to: query.to }),
    );
  }

  publishTime(query: AnalyticsRangeQuery = {}): Promise<PublishTimeStat[]> {
    return this.client.get<PublishTimeStat[]>(
      "/admin/analytics/publish-time",
      cleanQuery({ range: query.range, from: query.from, to: query.to }),
    );
  }
}
