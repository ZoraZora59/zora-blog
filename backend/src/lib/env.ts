import dotenv from 'dotenv';

dotenv.config({
  path: '.env',
  override: true,
  quiet: true,
});

function getEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`缺少环境变量: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string, fallback = '') {
  return (process.env[name] ?? fallback).trim();
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: getEnv(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/zora_blog?schema=public',
  ),
  jwtSecret: getEnv('JWT_SECRET', 'dev-jwt-secret-change-me-please'),
  apiKeySalt: getEnv('API_KEY_SALT', 'dev-api-key-salt-change-me-please'),
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'admin123456',
  siteUrl: (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  qiniuAccessKey: getOptionalEnv('QINIU_ACCESS_KEY'),
  qiniuSecretKey: getOptionalEnv('QINIU_SECRET_KEY'),
  qiniuBucket: getOptionalEnv('QINIU_BUCKET'),
  qiniuRootPrefix: process.env.QINIU_ROOT_PREFIX ?? '/zora_blog',
  qiniuPublicBaseUrl: getOptionalEnv('QINIU_PUBLIC_BASE_URL').replace(/\/$/, ''),
  analyticsSalt: process.env.ANALYTICS_SALT ?? 'dev-analytics-salt-change-me-please-please-please',
  analyticsPvRetentionDays: Number(process.env.ANALYTICS_PV_RETENTION_DAYS ?? 90),
  maxmindDbPath: process.env.MAXMIND_DB_PATH ?? './data/GeoLite2-City.mmdb',
  analyticsAggregateCron: process.env.ANALYTICS_AGGREGATE_CRON ?? '*/5 * * * *',
};
