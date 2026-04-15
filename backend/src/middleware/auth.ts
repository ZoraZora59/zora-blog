import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { AppError } from '../lib/app-error.js';
import { hashApiKey, verifyJwtToken } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import type { AppBindings } from '../lib/types.js';

const AUTH_COOKIE_NAME = 'zora_token';

async function findAdminByBearerToken(rawToken: string) {
  const apiKeyHash = hashApiKey(rawToken);
  return prisma.admin.findFirst({
    where: {
      apiKey: apiKeyHash,
    },
  });
}

export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  const authorization = c.req.header('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : undefined;

  if (bearerToken) {
    const admin = await findAdminByBearerToken(bearerToken);

    if (!admin) {
      throw new AppError('未认证', 401);
    }

    c.set('admin', {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
    });
    c.set('authMethod', 'bearer');
    await next();
    return;
  }

  const token = getCookie(c, AUTH_COOKIE_NAME);
  if (!token) {
    throw new AppError('未认证', 401);
  }

  const payload = verifyJwtToken(token);
  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
  });

  if (!admin) {
    throw new AppError('未认证', 401);
  }

  c.set('admin', {
    id: admin.id,
    username: admin.username,
    displayName: admin.displayName,
  });
  c.set('authMethod', 'cookie');
  await next();
});

export const requireCookieAuth = createMiddleware<AppBindings>(async (c, next) => {
  await requireAuth(c, async () => {
    if (c.get('authMethod') !== 'cookie') {
      throw new AppError('该操作仅支持 Cookie 登录态', 403);
    }

    await next();
  });
});
