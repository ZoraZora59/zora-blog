import { ArticleStatus } from '@prisma/client';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { buildExcerpt } from '../lib/text.js';

const FEED_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedFeed: { expiresAt: number; xml: string } | null = null;

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSiteUrl(path = '/') {
  return new URL(path, `${env.siteUrl}/`).toString();
}

function formatRssDate(value: Date | string | null | undefined) {
  return new Date(value ?? Date.now()).toUTCString();
}

export async function getRssFeedXml() {
  const now = Date.now();

  if (cachedFeed && cachedFeed.expiresAt > now) {
    return cachedFeed.xml;
  }

  const [site, articles] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: {
        siteTitle: true,
        siteDescription: true,
        email: true,
      },
    }),
    prisma.article.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 20,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const siteTitle = site?.siteTitle || 'Zora Blog';
  const siteDescription = site?.siteDescription || 'Zora Blog RSS Feed';
  const buildDate = articles[0]?.updatedAt ?? new Date();
  const authorLine = site?.email
    ? `    <managingEditor>${escapeXml(site.email)}</managingEditor>`
    : '';
  const items = articles
    .map((article) => {
      const articleUrl = buildSiteUrl(`/articles/${article.slug}`);
      const description = escapeXml(article.excerpt || buildExcerpt(article.content, 220));

      return [
        '    <item>',
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${articleUrl}</link>`,
        `      <guid isPermaLink="true">${articleUrl}</guid>`,
        `      <pubDate>${formatRssDate(article.publishedAt)}</pubDate>`,
        `      <description>${description}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(siteTitle)}</title>`,
    `    <link>${buildSiteUrl('/')}</link>`,
    `    <description>${escapeXml(siteDescription)}</description>`,
    `    <lastBuildDate>${formatRssDate(buildDate)}</lastBuildDate>`,
    '    <language>zh-cn</language>',
    authorLine,
    items,
    '  </channel>',
    '</rss>',
  ]
    .filter(Boolean)
    .join('\n');

  cachedFeed = {
    xml,
    expiresAt: now + FEED_CACHE_TTL_MS,
  };

  return xml;
}
