import { createMiddleware } from 'hono/factory';
import { env } from '../lib/env.js';

export const requestLogger = createMiddleware(async (c, next) => {
  if (env.nodeEnv === 'test') {
    await next();
    return;
  }

  const startedAt = Date.now();
  await next();
  const duration = Date.now() - startedAt;
  console.warn(`${c.req.method} ${c.req.path} -> ${c.res.status} (${duration}ms)`);
});
