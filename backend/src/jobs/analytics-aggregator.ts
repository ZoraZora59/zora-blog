import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';

// 增量聚合：默认聚合 from = 今天 00:00 - 1 天，to = 现在
// 即覆盖 "昨天 + 今天" 两天的窗口，避免跨日时遗漏
function defaultWindow(): { from: Date; to: Date } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(todayStart.getTime() - 24 * 60 * 60_000);
  return { from, to: now };
}

interface AggregateOptions {
  from?: Date;
  to?: Date;
}

export async function aggregateSiteStats(options: AggregateOptions = {}): Promise<void> {
  const { from, to } = { ...defaultWindow(), ...options };

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO daily_site_stats (date, pv, uv, sessions, "newVisitors", "bounceRate", "avgPagesPerSession", "updatedAt")
    SELECT
      d.date,
      d.pv,
      d.uv,
      d.sessions,
      d.new_visitors,
      d.bounce_rate,
      d.avg_pages_per_session,
      NOW()
    FROM (
      SELECT
        date_trunc('day', "createdAt")::date AS date,
        COUNT(*) AS pv,
        COUNT(DISTINCT "visitorId") AS uv,
        COUNT(DISTINCT "sessionId") AS sessions,
        COUNT(DISTINCT "visitorId") FILTER (WHERE "isNewVisitor") AS new_visitors,
        (
          (COUNT(DISTINCT "sessionId") FILTER (WHERE single_pv))::float
          / NULLIF(COUNT(DISTINCT "sessionId"), 0)
        ) AS bounce_rate,
        (COUNT(*)::float / NULLIF(COUNT(DISTINCT "sessionId"), 0)) AS avg_pages_per_session
      FROM (
        SELECT
          "createdAt",
          "visitorId",
          "sessionId",
          "isNewVisitor",
          (COUNT(*) OVER (PARTITION BY "sessionId") = 1) AS single_pv
        FROM page_views
        WHERE "createdAt" >= $1 AND "createdAt" < $2
          AND NOT "isBot" AND NOT "isAdmin"
      ) sub
      GROUP BY date_trunc('day', "createdAt")::date
    ) d
    ON CONFLICT (date) DO UPDATE SET
      pv = EXCLUDED.pv,
      uv = EXCLUDED.uv,
      sessions = EXCLUDED.sessions,
      "newVisitors" = EXCLUDED."newVisitors",
      "bounceRate" = EXCLUDED."bounceRate",
      "avgPagesPerSession" = EXCLUDED."avgPagesPerSession",
      "updatedAt" = NOW();
    `,
    from,
    to,
  );
}

export async function aggregateArticleStats(options: AggregateOptions = {}): Promise<void> {
  const { from, to } = { ...defaultWindow(), ...options };

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO daily_article_stats (date, "articleId", pv, uv, "updatedAt")
    SELECT
      date_trunc('day', "createdAt")::date AS date,
      "articleId",
      COUNT(*) AS pv,
      COUNT(DISTINCT "visitorId") AS uv,
      NOW()
    FROM page_views
    WHERE "createdAt" >= $1 AND "createdAt" < $2
      AND "articleId" IS NOT NULL
      AND NOT "isBot" AND NOT "isAdmin"
    GROUP BY date_trunc('day', "createdAt")::date, "articleId"
    ON CONFLICT (date, "articleId") DO UPDATE SET
      pv = EXCLUDED.pv,
      uv = EXCLUDED.uv,
      "updatedAt" = NOW();
    `,
    from,
    to,
  );
}

export async function aggregateReferrerStats(options: AggregateOptions = {}): Promise<void> {
  const { from, to } = { ...defaultWindow(), ...options };

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO daily_referrer_stats (date, "referrerHost", "referrerType", pv, uv, "updatedAt")
    SELECT
      date_trunc('day', "createdAt")::date AS date,
      COALESCE("referrerHost", '(direct)') AS host,
      MAX("referrerType"::text)::"ReferrerType" AS type,
      COUNT(*) AS pv,
      COUNT(DISTINCT "visitorId") AS uv,
      NOW()
    FROM page_views
    WHERE "createdAt" >= $1 AND "createdAt" < $2
      AND NOT "isBot" AND NOT "isAdmin"
    GROUP BY date_trunc('day', "createdAt")::date, COALESCE("referrerHost", '(direct)')
    ON CONFLICT (date, "referrerHost") DO UPDATE SET
      pv = EXCLUDED.pv,
      uv = EXCLUDED.uv,
      "referrerType" = EXCLUDED."referrerType",
      "updatedAt" = NOW();
    `,
    from,
    to,
  );
}

export async function aggregateGeoStats(options: AggregateOptions = {}): Promise<void> {
  const { from, to } = { ...defaultWindow(), ...options };

  // 国家级（region 为空字符串）
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO daily_geo_stats (date, country, region, pv, uv, "updatedAt")
    SELECT
      date_trunc('day', "createdAt")::date AS date,
      country,
      '' AS region,
      COUNT(*) AS pv,
      COUNT(DISTINCT "visitorId") AS uv,
      NOW()
    FROM page_views
    WHERE "createdAt" >= $1 AND "createdAt" < $2
      AND country IS NOT NULL
      AND NOT "isBot" AND NOT "isAdmin"
    GROUP BY date_trunc('day', "createdAt")::date, country
    ON CONFLICT (date, country, region) DO UPDATE SET
      pv = EXCLUDED.pv,
      uv = EXCLUDED.uv,
      "updatedAt" = NOW();
    `,
    from,
    to,
  );

  // 省/州级（region 非空时单独存一条）
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO daily_geo_stats (date, country, region, pv, uv, "updatedAt")
    SELECT
      date_trunc('day', "createdAt")::date AS date,
      country,
      region,
      COUNT(*) AS pv,
      COUNT(DISTINCT "visitorId") AS uv,
      NOW()
    FROM page_views
    WHERE "createdAt" >= $1 AND "createdAt" < $2
      AND country IS NOT NULL AND region IS NOT NULL AND region <> ''
      AND NOT "isBot" AND NOT "isAdmin"
    GROUP BY date_trunc('day', "createdAt")::date, country, region
    ON CONFLICT (date, country, region) DO UPDATE SET
      pv = EXCLUDED.pv,
      uv = EXCLUDED.uv,
      "updatedAt" = NOW();
    `,
    from,
    to,
  );
}

export async function aggregateDeviceStats(options: AggregateOptions = {}): Promise<void> {
  const { from, to } = { ...defaultWindow(), ...options };

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO daily_device_stats (date, device, os, browser, pv, uv, "updatedAt")
    SELECT
      date_trunc('day', "createdAt")::date AS date,
      COALESCE(device, 'unknown') AS device,
      COALESCE(os, '') AS os,
      COALESCE(browser, '') AS browser,
      COUNT(*) AS pv,
      COUNT(DISTINCT "visitorId") AS uv,
      NOW()
    FROM page_views
    WHERE "createdAt" >= $1 AND "createdAt" < $2
      AND NOT "isBot" AND NOT "isAdmin"
    GROUP BY date_trunc('day', "createdAt")::date,
             COALESCE(device, 'unknown'),
             COALESCE(os, ''),
             COALESCE(browser, '')
    ON CONFLICT (date, device, os, browser) DO UPDATE SET
      pv = EXCLUDED.pv,
      uv = EXCLUDED.uv,
      "updatedAt" = NOW();
    `,
    from,
    to,
  );
}

export async function aggregateCategoryStats(options: AggregateOptions = {}): Promise<void> {
  const { from, to } = { ...defaultWindow(), ...options };

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO daily_category_stats (date, "categoryId", pv, uv, "updatedAt")
    SELECT
      date_trunc('day', pv."createdAt")::date AS date,
      a."categoryId",
      COUNT(*) AS pv,
      COUNT(DISTINCT pv."visitorId") AS uv,
      NOW()
    FROM page_views pv
    JOIN articles a ON a.id = pv."articleId"
    WHERE pv."createdAt" >= $1 AND pv."createdAt" < $2
      AND pv."articleId" IS NOT NULL
      AND NOT pv."isBot" AND NOT pv."isAdmin"
    GROUP BY date_trunc('day', pv."createdAt")::date, a."categoryId"
    ON CONFLICT (date, "categoryId") DO UPDATE SET
      pv = EXCLUDED.pv,
      uv = EXCLUDED.uv,
      "updatedAt" = NOW();
    `,
    from,
    to,
  );
}

export async function runAllAggregations(options: AggregateOptions = {}): Promise<void> {
  const startedAt = Date.now();
  await aggregateSiteStats(options);
  await aggregateArticleStats(options);
  await aggregateReferrerStats(options);
  await aggregateGeoStats(options);
  await aggregateDeviceStats(options);
  await aggregateCategoryStats(options);
  console.warn(`[analytics] 聚合完成，耗时 ${Date.now() - startedAt}ms`);
}

// 数据保留：删除超过保留期的原始事件
export async function pruneOldPageViews(): Promise<number> {
  const cutoff = new Date(Date.now() - env.analyticsPvRetentionDays * 24 * 60 * 60_000);
  const result = await prisma.pageView.deleteMany({ where: { createdAt: { lt: cutoff } } });
  console.warn(`[analytics] 清理 ${result.count} 条 ${env.analyticsPvRetentionDays} 天前的 page_views`);
  return result.count;
}

let aggregateTask: ReturnType<typeof cron.schedule> | null = null;
let pruneTask: ReturnType<typeof cron.schedule> | null = null;

export function startAnalyticsJobs(): void {
  if (aggregateTask) return;

  aggregateTask = cron.schedule(env.analyticsAggregateCron, () => {
    runAllAggregations().catch((err) => {
      console.error('[analytics] 聚合任务失败', err);
    });
  });

  // 每天 03:00 清理过期数据
  pruneTask = cron.schedule('0 3 * * *', () => {
    pruneOldPageViews().catch((err) => {
      console.error('[analytics] 清理任务失败', err);
    });
  });

  console.warn(
    `[analytics] cron 已启动：聚合 ${env.analyticsAggregateCron}，保留 ${env.analyticsPvRetentionDays} 天`,
  );
}

export function stopAnalyticsJobs(): void {
  aggregateTask?.stop();
  pruneTask?.stop();
  aggregateTask = null;
  pruneTask = null;
}
