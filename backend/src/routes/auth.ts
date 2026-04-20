import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { AppError } from '../lib/app-error.js';
import { env } from '../lib/env.js';
import { signJwtToken } from '../lib/auth.js';
import { success } from '../lib/response.js';
import { loginAdmin, generateAdminApiKey, revokeAdminApiKey } from '../services/auth-service.js';
import { requireAuth, requireCookieAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import type { AppBindings } from '../lib/types.js';

const AUTH_COOKIE_NAME = 'zora_token';

export const authRoutes = new Hono<AppBindings>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>().catch(() => {
    throw new AppError('请求体必须是 JSON');
  });

  const admin = await loginAdmin(body.username ?? '', body.password ?? '');
  const token = signJwtToken({
    adminId: admin.id,
    username: admin.username,
  });

  setCookie(c, AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: env.nodeEnv === 'production',
    maxAge: 60 * 60 * 24 * 7,
  });

  return success(c, { admin }, '登录成功');
});

authRoutes.get('/me', requireAuth, async (c) => {
  const current = c.get('admin');
  const admin = await prisma.admin.findUnique({
    where: { id: current.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      bio: true,
      role: true,
      apiKeyPrefix: true,
    },
  });
  if (!admin) throw new AppError('管理员不存在', 404);
  return success(c, { admin, authMethod: c.get('authMethod') });
});

authRoutes.post('/logout', async (c) => {
  deleteCookie(c, AUTH_COOKIE_NAME, {
    path: '/',
  });
  return success(c, null, '已退出登录');
});

authRoutes.post('/token', requireCookieAuth, async (c) => {
  const admin = c.get('admin');
  const apiKey = await generateAdminApiKey(admin.id);
  return success(c, apiKey, 'API Key 已生成');
});

authRoutes.delete('/token', requireCookieAuth, async (c) => {
  const admin = c.get('admin');
  await revokeAdminApiKey(admin.id);
  return success(c, null, 'API Key 已吊销');
});
