import { createMiddleware } from 'hono/factory';
import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import { failure } from '../lib/response.js';

interface Bucket {
  tokens: number;
  refilledAt: number;
}

interface RateLimitOptions {
  // 每分钟允许的请求数
  perMinute: number;
  // 桶容量（默认等于 perMinute）
  capacity?: number;
}

// 简单内存令牌桶限流，按 IP 维度。仅用于轻量保护（采集接口防刷）。
// 多实例部署时各自独立计数；如需全局精确限流应改用 Redis。
export function rateLimit(options: RateLimitOptions) {
  const capacity = options.capacity ?? options.perMinute;
  const refillRatePerMs = options.perMinute / 60_000;
  const buckets = new Map<string, Bucket>();

  // 简单的过期清理：每 5 分钟清理超过 10 分钟没活动的桶
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now - bucket.refilledAt > 10 * 60_000) buckets.delete(key);
    }
  }, 5 * 60_000).unref();

  return createMiddleware(async (c, next) => {
    const ip = getClientIp(c);
    const key = ip || 'unknown';
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: capacity, refilledAt: now };
      buckets.set(key, bucket);
    } else {
      const elapsed = now - bucket.refilledAt;
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillRatePerMs);
      bucket.refilledAt = now;
    }

    if (bucket.tokens < 1) {
      c.header('Retry-After', '60');
      return failure(c, '请求过于频繁，请稍后再试', 429);
    }

    bucket.tokens -= 1;
    await next();
  });
}

// 提取客户端 IP：优先 X-Forwarded-For（Nginx 反代注入），回落 hono ConnInfo
export function getClientIp(c: Context): string {
  const xff = c.req.header('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp.trim();

  try {
    const info = getConnInfo(c);
    return info.remote.address ?? '';
  } catch {
    return '';
  }
}
