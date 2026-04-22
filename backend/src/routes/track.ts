import { Hono } from 'hono';
import { rateLimit, getClientIp } from '../middleware/rate-limit.js';
import { recordPageView } from '../services/analytics-service.js';
import type { TrackPayload } from '../services/analytics-service.js';

export const trackRoutes = new Hono();

// 限流：60 次 / 分钟 / IP
trackRoutes.use('*', rateLimit({ perMinute: 60 }));

trackRoutes.post('/pageview', async (c) => {
  let payload: TrackPayload;
  try {
    payload = (await c.req.json()) as TrackPayload;
  } catch {
    return c.body(null, 400);
  }

  if (!payload || typeof payload.path !== 'string' || !payload.visitorId || !payload.sessionId) {
    return c.body(null, 400);
  }

  const userAgent = c.req.header('user-agent') ?? '';
  const ip = getClientIp(c);

  // 异步写入：响应不等 DB，避免拖慢前端 sendBeacon
  recordPageView(payload, { ip, userAgent }).catch((err) => {
    console.error('[analytics] recordPageView failed', err);
  });

  return c.body(null, 204);
});
