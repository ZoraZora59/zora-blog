import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requestLogger } from './middleware/logger.js';
import { handleError } from './middleware/error.js';
import { success } from './lib/response.js';
import { env } from './lib/env.js';
import { authRoutes } from './routes/auth.js';
import { publicRoutes } from './routes/public.js';
import { adminRoutes } from './routes/admin.js';
import { trackRoutes } from './routes/track.js';
import { ensureUploadsDir, uploadsDir, allowedMimeTypes } from './lib/uploads.js';
import { preloadGeoip } from './lib/geoip.js';
import { startAnalyticsJobs } from './jobs/analytics-aggregator.js';

const app = new Hono();

app.use('*', requestLogger);
const corsOrigins = (() => {
  const origins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  if (env.siteUrl && !env.siteUrl.includes('localhost')) {
    origins.push(env.siteUrl);
    const bare = env.siteUrl.replace('://www.', '://');
    if (bare !== env.siteUrl) origins.push(bare);
  }
  return origins;
})();

app.use('/api/*', cors({
  origin: corsOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.get('/', (c) => {
  return c.json({ message: 'Zora Blog API' });
});

app.get('/uploads/:filename', async (c) => {
  const filename = c.req.param('filename');
  const safeName = path.basename(filename);

  if (safeName !== filename) {
    return c.notFound();
  }

  const filePath = path.join(uploadsDir, safeName);

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath);
    const contentType =
      Object.entries(allowedMimeTypes).find(([, ext]) => ext === extension)?.[0] ??
      'application/octet-stream';

    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return c.notFound();
  }
});

app.route('/api/auth', authRoutes);
app.route('/api/track', trackRoutes);
app.route('/api', publicRoutes);
app.route('/api/admin', adminRoutes);

app.notFound((c) => success(c, null, 'Not Found', 404));
app.onError(handleError);

await ensureUploadsDir();
await preloadGeoip();
startAnalyticsJobs();

serve(
  {
    fetch: app.fetch,
    port: env.port,
  },
  (info) => {
    console.warn(`Zora Blog API running at http://localhost:${info.port}`);
  },
);
