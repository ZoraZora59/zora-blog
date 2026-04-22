import { Hono } from 'hono';
import { AppError } from '../lib/app-error.js';
import { parseIdParam } from '../lib/pagination.js';
import { success } from '../lib/response.js';
import { parseAnalyticsRange } from '../lib/analytics-range.js';
import type { AppBindings } from '../lib/types.js';
import {
  getOverview,
  getTimeline,
  getTopArticles,
  getArticleTimeline,
  getCategoryStats,
  getTopicStats,
  getReferrerStats,
  getUtmStats,
  getEntryPages,
  getGeoStats,
  getDeviceStats,
  getVisitorBreakdown,
  getPublishTimeStats,
} from '../services/analytics-query-service.js';

export const adminAnalyticsRoutes = new Hono<AppBindings>();

function parseRange(c: { req: { query(name: string): string | undefined } }) {
  try {
    return parseAnalyticsRange({
      range: c.req.query('range'),
      from: c.req.query('from'),
      to: c.req.query('to'),
    });
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : '无效的 range 参数');
  }
}

function parseLimit(value: string | undefined, defaultValue = 10): number {
  if (!value) return defaultValue;
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return defaultValue;
  return Math.min(100, n);
}

adminAnalyticsRoutes.get('/overview', async (c) => {
  const range = parseRange(c);
  const compare = c.req.query('compare') === 'true';
  return success(c, await getOverview({ range, compare }));
});

adminAnalyticsRoutes.get('/timeline', async (c) => {
  const range = parseRange(c);
  const granularityRaw = c.req.query('granularity') ?? 'day';
  if (granularityRaw !== 'hour' && granularityRaw !== 'day' && granularityRaw !== 'week') {
    throw new AppError('granularity 必须是 hour | day | week');
  }
  try {
    return success(c, await getTimeline({ range, granularity: granularityRaw }));
  } catch (err) {
    throw new AppError(err instanceof Error ? err.message : '查询失败');
  }
});

adminAnalyticsRoutes.get('/articles', async (c) => {
  const range = parseRange(c);
  const limit = parseLimit(c.req.query('limit'));
  const sortRaw = c.req.query('sort') ?? 'pv';
  const sort = sortRaw === 'uv' ? 'uv' : 'pv';
  return success(c, await getTopArticles({ range, limit, sort }));
});

adminAnalyticsRoutes.get('/articles/:id', async (c) => {
  const range = parseRange(c);
  const articleId = parseIdParam(c.req.param('id'));
  return success(c, await getArticleTimeline({ range, articleId }));
});

adminAnalyticsRoutes.get('/categories', async (c) => {
  const range = parseRange(c);
  const limit = parseLimit(c.req.query('limit'), 20);
  return success(c, await getCategoryStats({ range, limit }));
});

adminAnalyticsRoutes.get('/topics', async (c) => {
  const range = parseRange(c);
  const limit = parseLimit(c.req.query('limit'), 20);
  return success(c, await getTopicStats({ range, limit }));
});

adminAnalyticsRoutes.get('/sources', async (c) => {
  const range = parseRange(c);
  const limit = parseLimit(c.req.query('limit'), 20);
  return success(c, await getReferrerStats({ range, limit }));
});

adminAnalyticsRoutes.get('/utm', async (c) => {
  const range = parseRange(c);
  const limit = parseLimit(c.req.query('limit'), 20);
  return success(c, await getUtmStats({ range, limit }));
});

adminAnalyticsRoutes.get('/entry-pages', async (c) => {
  const range = parseRange(c);
  const limit = parseLimit(c.req.query('limit'), 20);
  return success(c, await getEntryPages({ range, limit }));
});

adminAnalyticsRoutes.get('/geo', async (c) => {
  const range = parseRange(c);
  const limit = parseLimit(c.req.query('limit'), 50);
  const levelRaw = c.req.query('level') ?? 'country';
  const level = levelRaw === 'region' ? 'region' : 'country';
  return success(c, await getGeoStats({ range, limit, level }));
});

adminAnalyticsRoutes.get('/devices', async (c) => {
  const range = parseRange(c);
  const limit = parseLimit(c.req.query('limit'), 20);
  const dimRaw = c.req.query('dimension') ?? 'device';
  const dimension = dimRaw === 'os' || dimRaw === 'browser' ? dimRaw : 'device';
  return success(c, await getDeviceStats({ range, limit, dimension }));
});

adminAnalyticsRoutes.get('/visitors', async (c) => {
  const range = parseRange(c);
  return success(c, await getVisitorBreakdown({ range }));
});

adminAnalyticsRoutes.get('/publish-time', async (c) => {
  const range = parseRange(c);
  return success(c, await getPublishTimeStats({ range }));
});
