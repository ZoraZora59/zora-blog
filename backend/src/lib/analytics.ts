import { createHmac } from 'node:crypto';
import { env } from './env.js';

export type ReferrerCategory = 'direct' | 'search' | 'social' | 'external' | 'internal';

const SEARCH_HOSTS = [
  'google.',
  'bing.com',
  'duckduckgo.com',
  'baidu.com',
  'yandex.',
  'so.com',
  'sogou.com',
  'naver.com',
  'yahoo.',
  'ecosia.org',
  'qwant.com',
  'kagi.com',
];

const SOCIAL_HOSTS = [
  'twitter.com',
  'x.com',
  't.co',
  'facebook.com',
  'fb.me',
  'instagram.com',
  'linkedin.com',
  'lnkd.in',
  'reddit.com',
  'pinterest.',
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'weibo.com',
  'zhihu.com',
  'douban.com',
  'bilibili.com',
  'okjike.com',
  'xiaohongshu.com',
  'mp.weixin.qq.com',
  'mastodon.',
  'bsky.',
  'threads.net',
];

export function hashIp(ip: string): string {
  return createHmac('sha256', env.analyticsSalt).update(ip).digest('hex');
}

export function classifyReferrer(
  referrer: string | undefined | null,
  selfHost: string | undefined | null,
): { type: ReferrerCategory; host: string | null } {
  if (!referrer) return { type: 'direct', host: null };

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return { type: 'direct', host: null };
  }

  if (selfHost && host === selfHost.toLowerCase()) {
    return { type: 'internal', host };
  }

  if (SEARCH_HOSTS.some((s) => host.includes(s))) {
    return { type: 'search', host };
  }

  if (SOCIAL_HOSTS.some((s) => host.includes(s))) {
    return { type: 'social', host };
  }

  return { type: 'external', host };
}

export type PageTypeKey = 'home' | 'article' | 'category' | 'topic' | 'about' | 'search' | 'other';

export interface ParsedPagePath {
  type: PageTypeKey;
  slug?: string;
}

// 根据 path 解析 pageType + slug；后续业务关联（articleId/categoryId/topicId）由 service 层查 DB 反查
export function parsePagePath(path: string): ParsedPagePath {
  const cleaned = path.split('?')[0].split('#')[0];

  if (cleaned === '/' || cleaned === '') return { type: 'home' };
  if (cleaned === '/about') return { type: 'about' };
  if (cleaned.startsWith('/search')) return { type: 'search' };

  const articleMatch = cleaned.match(/^\/articles\/([^/]+)\/?$/);
  if (articleMatch) return { type: 'article', slug: articleMatch[1] };

  const categoryMatch = cleaned.match(/^\/categories\/([^/]+)\/?$/);
  if (categoryMatch) return { type: 'category', slug: categoryMatch[1] };

  const topicMatch = cleaned.match(/^\/topics\/([^/]+)\/?$/);
  if (topicMatch) return { type: 'topic', slug: topicMatch[1] };

  if (cleaned === '/topics') return { type: 'topic' };

  return { type: 'other' };
}

export function isAdminPath(path: string): boolean {
  return path.startsWith('/admin') || path === '/login';
}

// 截断字符串，避免恶意超长输入打满字段
export function truncate(value: string | undefined | null, max: number): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}
