import { prisma } from '../lib/prisma.js';
import type { AnalyticsRange } from '../lib/analytics-range.js';
import { formatDelta } from '../lib/analytics-range.js';

interface RangeArgs {
  range: AnalyticsRange;
  limit?: number;
}

interface SiteAggregate {
  pv: number;
  uv: number;
  sessions: number;
  newVisitors: number;
  bounceRate: number | null;
  avgPagesPerSession: number | null;
}

async function loadSiteAggregate(from: Date, to: Date): Promise<SiteAggregate> {
  const rows = await prisma.dailySiteStat.findMany({
    where: { date: { gte: from, lt: to } },
  });
  if (rows.length === 0) {
    return { pv: 0, uv: 0, sessions: 0, newVisitors: 0, bounceRate: null, avgPagesPerSession: null };
  }
  const pv = rows.reduce((s, r) => s + r.pv, 0);
  const uv = rows.reduce((s, r) => s + r.uv, 0); // 注意：跨日 UV 实际是上限，非精确去重
  const sessions = rows.reduce((s, r) => s + r.sessions, 0);
  const newVisitors = rows.reduce((s, r) => s + r.newVisitors, 0);
  const bounceWeighted = rows.reduce(
    (s, r) => s + (r.bounceRate ?? 0) * r.sessions,
    0,
  );
  const pagesWeighted = rows.reduce(
    (s, r) => s + (r.avgPagesPerSession ?? 0) * r.sessions,
    0,
  );
  return {
    pv,
    uv,
    sessions,
    newVisitors,
    bounceRate: sessions > 0 ? bounceWeighted / sessions : null,
    avgPagesPerSession: sessions > 0 ? pagesWeighted / sessions : null,
  };
}

export async function getOverview(args: RangeArgs & { compare?: boolean }) {
  const { range, compare } = args;
  const current = await loadSiteAggregate(range.from, range.to);
  let previous: SiteAggregate | null = null;
  let delta: Record<string, string> | null = null;
  if (compare) {
    previous = await loadSiteAggregate(range.previousFrom, range.previousTo);
    delta = {
      pv: formatDelta(current.pv, previous.pv),
      uv: formatDelta(current.uv, previous.uv),
      sessions: formatDelta(current.sessions, previous.sessions),
      newVisitors: formatDelta(current.newVisitors, previous.newVisitors),
    };
  }
  return {
    range: {
      from: range.from.toISOString().slice(0, 10),
      to: new Date(range.to.getTime() - 1).toISOString().slice(0, 10),
    },
    current,
    previous,
    delta,
  };
}

export async function getTimeline(
  args: RangeArgs & { granularity: 'hour' | 'day' | 'week' },
) {
  const { range, granularity } = args;
  if (granularity === 'hour') {
    if (range.days > 7) throw new Error('hour 粒度最多 7 天');
    const rows = await prisma.$queryRawUnsafe<
      { bucket: Date; pv: bigint; uv: bigint }[]
    >(
      `SELECT date_trunc('hour', "createdAt") AS bucket,
              COUNT(*) AS pv,
              COUNT(DISTINCT "visitorId") AS uv
       FROM page_views
       WHERE "createdAt" >= $1 AND "createdAt" < $2
         AND NOT "isBot" AND NOT "isAdmin"
       GROUP BY 1
       ORDER BY 1`,
      range.from,
      range.to,
    );
    return rows.map((r) => ({
      bucket: r.bucket.toISOString(),
      pv: Number(r.pv),
      uv: Number(r.uv),
    }));
  }

  // day / week 走聚合表
  const rows = await prisma.dailySiteStat.findMany({
    where: { date: { gte: range.from, lt: range.to } },
    orderBy: { date: 'asc' },
  });

  if (granularity === 'day') {
    return rows.map((r) => ({
      bucket: r.date.toISOString().slice(0, 10),
      pv: r.pv,
      uv: r.uv,
      sessions: r.sessions,
    }));
  }

  // week：按周聚合
  const weeks = new Map<string, { pv: number; uv: number; sessions: number }>();
  for (const r of rows) {
    const d = new Date(r.date);
    const dayOfWeek = d.getUTCDay();
    const monday = new Date(d.getTime() - ((dayOfWeek + 6) % 7) * 86400_000);
    const key = monday.toISOString().slice(0, 10);
    const acc = weeks.get(key) ?? { pv: 0, uv: 0, sessions: 0 };
    acc.pv += r.pv;
    acc.uv += r.uv;
    acc.sessions += r.sessions;
    weeks.set(key, acc);
  }
  return Array.from(weeks.entries()).map(([bucket, v]) => ({ bucket, ...v }));
}

export async function getTopArticles(args: RangeArgs & { sort?: 'pv' | 'uv' }) {
  const { range, limit = 10, sort = 'pv' } = args;
  const grouped = await prisma.dailyArticleStat.groupBy({
    by: ['articleId'],
    where: { date: { gte: range.from, lt: range.to } },
    _sum: { pv: true, uv: true },
    orderBy: { _sum: { [sort]: 'desc' } },
    take: limit,
  });
  if (grouped.length === 0) return [];
  const articles = await prisma.article.findMany({
    where: { id: { in: grouped.map((g) => g.articleId) } },
    select: { id: true, title: true, slug: true, publishedAt: true, status: true },
  });
  const map = new Map(articles.map((a) => [a.id, a]));
  return grouped.map((g) => ({
    articleId: g.articleId,
    article: map.get(g.articleId) ?? null,
    pv: g._sum.pv ?? 0,
    uv: g._sum.uv ?? 0,
  }));
}

export async function getArticleTimeline(args: RangeArgs & { articleId: number }) {
  const { range, articleId } = args;
  const rows = await prisma.dailyArticleStat.findMany({
    where: { articleId, date: { gte: range.from, lt: range.to } },
    orderBy: { date: 'asc' },
  });
  return rows.map((r) => ({
    bucket: r.date.toISOString().slice(0, 10),
    pv: r.pv,
    uv: r.uv,
  }));
}

export async function getCategoryStats(args: RangeArgs) {
  const { range, limit = 20 } = args;
  const grouped = await prisma.dailyCategoryStat.groupBy({
    by: ['categoryId'],
    where: { date: { gte: range.from, lt: range.to } },
    _sum: { pv: true, uv: true },
    orderBy: { _sum: { pv: 'desc' } },
    take: limit,
  });
  if (grouped.length === 0) return [];
  const cats = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
    select: { id: true, name: true, slug: true },
  });
  const map = new Map(cats.map((c) => [c.id, c]));
  return grouped.map((g) => ({
    categoryId: g.categoryId,
    category: map.get(g.categoryId) ?? null,
    pv: g._sum.pv ?? 0,
    uv: g._sum.uv ?? 0,
  }));
}

export async function getTopicStats(args: RangeArgs) {
  const { range, limit = 20 } = args;
  // 通过 topic_articles 关联 dailyArticleStat 聚合
  const rows = await prisma.$queryRawUnsafe<
    { topicId: number; pv: bigint; uv: bigint }[]
  >(
    `SELECT ta."topicId" AS "topicId",
            SUM(das.pv) AS pv,
            SUM(das.uv) AS uv
     FROM daily_article_stats das
     JOIN topic_articles ta ON ta."articleId" = das."articleId"
     WHERE das.date >= $1 AND das.date < $2
     GROUP BY ta."topicId"
     ORDER BY pv DESC
     LIMIT $3`,
    range.from,
    range.to,
    limit,
  );
  if (rows.length === 0) return [];
  const topics = await prisma.topic.findMany({
    where: { id: { in: rows.map((r) => r.topicId) } },
    select: { id: true, title: true, slug: true },
  });
  const map = new Map(topics.map((t) => [t.id, t]));
  return rows.map((r) => ({
    topicId: r.topicId,
    topic: map.get(r.topicId) ?? null,
    pv: Number(r.pv),
    uv: Number(r.uv),
  }));
}

export async function getReferrerStats(args: RangeArgs) {
  const { range, limit = 20 } = args;
  const rows = await prisma.dailyReferrerStat.groupBy({
    by: ['referrerHost', 'referrerType'],
    where: { date: { gte: range.from, lt: range.to } },
    _sum: { pv: true, uv: true },
    orderBy: { _sum: { pv: 'desc' } },
    take: limit,
  });
  return rows.map((r) => ({
    host: r.referrerHost,
    type: r.referrerType,
    pv: r._sum.pv ?? 0,
    uv: r._sum.uv ?? 0,
  }));
}

export async function getUtmStats(args: RangeArgs) {
  const { range, limit = 20 } = args;
  const rows = await prisma.$queryRawUnsafe<
    {
      source: string | null;
      medium: string | null;
      campaign: string | null;
      pv: bigint;
      uv: bigint;
    }[]
  >(
    `SELECT "utmSource" AS source,
            "utmMedium" AS medium,
            "utmCampaign" AS campaign,
            COUNT(*) AS pv,
            COUNT(DISTINCT "visitorId") AS uv
     FROM page_views
     WHERE "createdAt" >= $1 AND "createdAt" < $2
       AND NOT "isBot" AND NOT "isAdmin"
       AND ("utmSource" IS NOT NULL OR "utmMedium" IS NOT NULL OR "utmCampaign" IS NOT NULL)
     GROUP BY 1, 2, 3
     ORDER BY pv DESC
     LIMIT $3`,
    range.from,
    range.to,
    limit,
  );
  return rows.map((r) => ({
    source: r.source,
    medium: r.medium,
    campaign: r.campaign,
    pv: Number(r.pv),
    uv: Number(r.uv),
  }));
}

export async function getEntryPages(args: RangeArgs) {
  const { range, limit = 20 } = args;
  const rows = await prisma.$queryRawUnsafe<
    { path: string; pv: bigint; uv: bigint }[]
  >(
    `SELECT path,
            COUNT(*) AS pv,
            COUNT(DISTINCT "visitorId") AS uv
     FROM (
       SELECT DISTINCT ON ("sessionId") "sessionId", path, "visitorId"
       FROM page_views
       WHERE "createdAt" >= $1 AND "createdAt" < $2
         AND NOT "isBot" AND NOT "isAdmin"
       ORDER BY "sessionId", "createdAt" ASC
     ) firsts
     GROUP BY path
     ORDER BY pv DESC
     LIMIT $3`,
    range.from,
    range.to,
    limit,
  );
  return rows.map((r) => ({ path: r.path, pv: Number(r.pv), uv: Number(r.uv) }));
}

export async function getGeoStats(
  args: RangeArgs & { level?: 'country' | 'region' },
) {
  const { range, limit = 50, level = 'country' } = args;
  const where = {
    date: { gte: range.from, lt: range.to },
    region: level === 'country' ? '' : { not: '' },
  };
  if (level === 'country') {
    const grouped = await prisma.dailyGeoStat.groupBy({
      by: ['country'],
      where,
      _sum: { pv: true, uv: true },
      orderBy: { _sum: { pv: 'desc' } },
      take: limit,
    });
    return grouped.map((g) => ({
      country: g.country,
      pv: g._sum.pv ?? 0,
      uv: g._sum.uv ?? 0,
    }));
  }
  const grouped = await prisma.dailyGeoStat.groupBy({
    by: ['country', 'region'],
    where,
    _sum: { pv: true, uv: true },
    orderBy: { _sum: { pv: 'desc' } },
    take: limit,
  });
  return grouped.map((g) => ({
    country: g.country,
    region: g.region,
    pv: g._sum.pv ?? 0,
    uv: g._sum.uv ?? 0,
  }));
}

export async function getDeviceStats(
  args: RangeArgs & { dimension?: 'device' | 'os' | 'browser' },
) {
  const { range, limit = 20, dimension = 'device' } = args;
  const grouped = await prisma.dailyDeviceStat.groupBy({
    by: [dimension],
    where: { date: { gte: range.from, lt: range.to } },
    _sum: { pv: true, uv: true },
    orderBy: { _sum: { pv: 'desc' } },
    take: limit,
  });
  return grouped.map((g) => ({
    [dimension]: g[dimension] || '(unknown)',
    pv: g._sum.pv ?? 0,
    uv: g._sum.uv ?? 0,
  }));
}

export async function getVisitorBreakdown(args: RangeArgs) {
  const { range } = args;
  const agg = await loadSiteAggregate(range.from, range.to);
  const returningVisitors = Math.max(0, agg.uv - agg.newVisitors);
  return {
    uv: agg.uv,
    newVisitors: agg.newVisitors,
    returningVisitors,
    sessions: agg.sessions,
    avgPagesPerSession: agg.avgPagesPerSession,
    bounceRate: agg.bounceRate,
    newRatio: agg.uv > 0 ? agg.newVisitors / agg.uv : 0,
  };
}

export async function getPublishTimeStats(args: RangeArgs) {
  const { range } = args;
  // 取范围内有数据的文章，关联文章发布时间
  const grouped = await prisma.dailyArticleStat.groupBy({
    by: ['articleId'],
    where: { date: { gte: range.from, lt: range.to } },
    _sum: { pv: true, uv: true },
  });
  if (grouped.length === 0) return [];
  const articles = await prisma.article.findMany({
    where: { id: { in: grouped.map((g) => g.articleId) }, publishedAt: { not: null } },
    select: { id: true, title: true, slug: true, publishedAt: true },
  });
  const map = new Map(articles.map((a) => [a.id, a]));
  return grouped
    .map((g) => {
      const a = map.get(g.articleId);
      if (!a || !a.publishedAt) return null;
      return {
        articleId: g.articleId,
        title: a.title,
        slug: a.slug,
        publishedAt: a.publishedAt,
        publishedHour: a.publishedAt.getHours(),
        publishedWeekday: a.publishedAt.getDay(),
        pv: g._sum.pv ?? 0,
        uv: g._sum.uv ?? 0,
      };
    })
    .filter((x) => x !== null);
}
