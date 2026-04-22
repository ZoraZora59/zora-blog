import { UAParser } from 'ua-parser-js';
import { PageType, ReferrerType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { hashIp, classifyReferrer, parsePagePath, isAdminPath, truncate } from '../lib/analytics.js';
import { lookupGeo } from '../lib/geoip.js';
import { isBotUserAgent } from '../lib/bot-ua-list.js';
import { env } from '../lib/env.js';

export interface TrackPayload {
  path: string;
  referrer?: string;
  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  language?: string;
  visitorId: string;
  sessionId: string;
  isNewVisitor?: boolean;
  isNewSession?: boolean;
  isAdmin?: boolean;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

export interface TrackContext {
  ip: string;
  userAgent: string;
}

const PAGE_TYPE_MAP: Record<string, PageType> = {
  home: PageType.HOME,
  article: PageType.ARTICLE,
  category: PageType.CATEGORY,
  topic: PageType.TOPIC,
  about: PageType.ABOUT,
  search: PageType.SEARCH,
  other: PageType.OTHER,
};

const REFERRER_TYPE_MAP: Record<string, ReferrerType> = {
  direct: ReferrerType.DIRECT,
  search: ReferrerType.SEARCH,
  social: ReferrerType.SOCIAL,
  external: ReferrerType.EXTERNAL,
  internal: ReferrerType.INTERNAL,
};

// 文章 / 分类 / 专题 slug → id 的内存缓存，避免每次 PV 都查 DB
const slugCache = {
  article: new Map<string, { id: number; expireAt: number }>(),
  category: new Map<string, { id: number; expireAt: number }>(),
  topic: new Map<string, { id: number; expireAt: number }>(),
};
const SLUG_CACHE_TTL_MS = 5 * 60_000;

async function lookupSlugId(
  kind: 'article' | 'category' | 'topic',
  slug: string,
): Promise<number | null> {
  const cache = slugCache[kind];
  const now = Date.now();
  const cached = cache.get(slug);
  if (cached && cached.expireAt > now) return cached.id;

  let id: number | null = null;
  if (kind === 'article') {
    const r = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
    id = r?.id ?? null;
  } else if (kind === 'category') {
    const r = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    id = r?.id ?? null;
  } else {
    const r = await prisma.topic.findUnique({ where: { slug }, select: { id: true } });
    id = r?.id ?? null;
  }

  if (id != null) cache.set(slug, { id, expireAt: now + SLUG_CACHE_TTL_MS });
  return id;
}

export async function recordPageView(
  payload: TrackPayload,
  ctx: TrackContext,
): Promise<void> {
  // 后台路径不入库
  if (isAdminPath(payload.path)) return;

  // 业务关联
  const parsed = parsePagePath(payload.path);
  let articleId: number | null = null;
  let categoryId: number | null = null;
  let topicId: number | null = null;

  if (parsed.type === 'article' && parsed.slug) {
    articleId = await lookupSlugId('article', parsed.slug);
  } else if (parsed.type === 'category' && parsed.slug) {
    categoryId = await lookupSlugId('category', parsed.slug);
  } else if (parsed.type === 'topic' && parsed.slug) {
    topicId = await lookupSlugId('topic', parsed.slug);
  }

  // UA 解析
  const ua = new UAParser(ctx.userAgent);
  const uaResult = ua.getResult();
  const isBot = isBotUserAgent(ctx.userAgent);

  const deviceTypeRaw = uaResult.device.type ?? '';
  const device = deviceTypeRaw === 'mobile' ? 'mobile'
    : deviceTypeRaw === 'tablet' ? 'tablet'
    : 'desktop';

  // Referrer 解析
  let selfHost: string | null = null;
  try {
    selfHost = new URL(env.siteUrl).hostname.toLowerCase();
  } catch {
    selfHost = null;
  }
  const refInfo = classifyReferrer(payload.referrer, selfHost);

  // Geo
  const geo = await lookupGeo(ctx.ip);

  // 写入
  await prisma.pageView.create({
    data: {
      path: truncate(payload.path, 1024) ?? '/',
      pageType: PAGE_TYPE_MAP[parsed.type] ?? PageType.OTHER,
      articleId,
      categoryId,
      topicId,
      visitorId: truncate(payload.visitorId, 64) ?? 'unknown',
      sessionId: truncate(payload.sessionId, 64) ?? 'unknown',
      isNewVisitor: payload.isNewVisitor ?? false,
      isNewSession: payload.isNewSession ?? false,
      referrer: truncate(payload.referrer, 1024),
      referrerHost: refInfo.host,
      referrerType: REFERRER_TYPE_MAP[refInfo.type],
      utmSource: truncate(payload.utm?.source, 256),
      utmMedium: truncate(payload.utm?.medium, 256),
      utmCampaign: truncate(payload.utm?.campaign, 256),
      userAgent: truncate(ctx.userAgent, 512) ?? 'unknown',
      device,
      os: uaResult.os.name ?? null,
      osVersion: uaResult.os.version ?? null,
      browser: uaResult.browser.name ?? null,
      browserVersion: uaResult.browser.version ?? null,
      screenWidth: payload.screenWidth ?? null,
      screenHeight: payload.screenHeight ?? null,
      viewportWidth: payload.viewportWidth ?? null,
      language: truncate(payload.language, 32),
      ipHash: hashIp(ctx.ip),
      country: geo.country,
      region: geo.region,
      city: geo.city,
      timezone: geo.timezone,
      isBot,
      isAdmin: payload.isAdmin ?? false,
    },
  });
}
