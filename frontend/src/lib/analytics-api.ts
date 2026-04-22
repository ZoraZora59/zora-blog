// 后台 Analytics 看板调用的 API 封装
//
// 与 lib/api.ts 同一套响应格式 { code, data, message }，使用 cookie 认证
import { ApiError } from './api';

export type AnalyticsRangeKey = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsRangeQuery {
  range?: AnalyticsRangeKey;
  from?: string;
  to?: string;
  limit?: number;
}

export interface OverviewSnapshot {
  pv: number;
  uv: number;
  sessions: number;
  newVisitors: number;
  bounceRate: number | null;
  avgPagesPerSession: number | null;
}

export interface OverviewResponse {
  range: { from: string; to: string };
  current: OverviewSnapshot;
  previous: OverviewSnapshot | null;
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

export type ReferrerType = 'DIRECT' | 'SEARCH' | 'SOCIAL' | 'EXTERNAL' | 'INTERNAL';

export interface ReferrerStat {
  host: string;
  type: ReferrerType;
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

const API_BASE_URL = '/api';

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const res = await fetch(buildUrl(path, query), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('服务端返回了不可解析的响应', res.status || 500);
  }
  if (!res.ok) {
    throw new ApiError(payload.message || '请求失败', payload.code || res.status || 500);
  }
  return payload.data;
}

function rangeQuery(q: AnalyticsRangeQuery, extra: Record<string, string | number | boolean | undefined> = {}) {
  return { range: q.range, from: q.from, to: q.to, limit: q.limit, ...extra };
}

export function getAnalyticsOverview(q: AnalyticsRangeQuery & { compare?: boolean } = {}) {
  return request<OverviewResponse>('/admin/analytics/overview', rangeQuery(q, { compare: q.compare ? 'true' : undefined }));
}

export function getAnalyticsTimeline(q: AnalyticsRangeQuery & { granularity?: 'hour' | 'day' | 'week' } = {}) {
  return request<TimelinePoint[]>('/admin/analytics/timeline', rangeQuery(q, { granularity: q.granularity }));
}

export function getAnalyticsTopArticles(q: AnalyticsRangeQuery & { sort?: 'pv' | 'uv' } = {}) {
  return request<TopArticleStat[]>('/admin/analytics/articles', rangeQuery(q, { sort: q.sort }));
}

export function getAnalyticsArticleTimeline(articleId: number, q: AnalyticsRangeQuery = {}) {
  return request<TimelinePoint[]>(`/admin/analytics/articles/${articleId}`, rangeQuery(q));
}

export function getAnalyticsCategoryStats(q: AnalyticsRangeQuery = {}) {
  return request<CategoryStat[]>('/admin/analytics/categories', rangeQuery(q));
}

export function getAnalyticsTopicStats(q: AnalyticsRangeQuery = {}) {
  return request<TopicStat[]>('/admin/analytics/topics', rangeQuery(q));
}

export function getAnalyticsSources(q: AnalyticsRangeQuery = {}) {
  return request<ReferrerStat[]>('/admin/analytics/sources', rangeQuery(q));
}

export function getAnalyticsUtm(q: AnalyticsRangeQuery = {}) {
  return request<UtmStat[]>('/admin/analytics/utm', rangeQuery(q));
}

export function getAnalyticsEntryPages(q: AnalyticsRangeQuery = {}) {
  return request<EntryPageStat[]>('/admin/analytics/entry-pages', rangeQuery(q));
}

export function getAnalyticsGeo(q: AnalyticsRangeQuery & { level?: 'country' | 'region' } = {}) {
  return request<(GeoCountryStat | GeoRegionStat)[]>('/admin/analytics/geo', rangeQuery(q, { level: q.level }));
}

export function getAnalyticsDevices(q: AnalyticsRangeQuery & { dimension?: 'device' | 'os' | 'browser' } = {}) {
  return request<DeviceStat[]>('/admin/analytics/devices', rangeQuery(q, { dimension: q.dimension }));
}

export function getAnalyticsVisitors(q: AnalyticsRangeQuery = {}) {
  return request<VisitorBreakdown>('/admin/analytics/visitors', rangeQuery(q));
}

export function getAnalyticsPublishTime(q: AnalyticsRangeQuery = {}) {
  return request<PublishTimeStat[]>('/admin/analytics/publish-time', rangeQuery(q));
}
