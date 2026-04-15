import type { Admin } from '@prisma/client';
import { AppError } from '../lib/app-error.js';
import { buildApiKey, verifyPassword } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

function sanitizeAdmin(admin: Admin) {
  return {
    id: admin.id,
    username: admin.username,
    displayName: admin.displayName,
    avatar: admin.avatar,
    bio: admin.bio,
    role: admin.role,
    apiKeyPrefix: admin.apiKeyPrefix,
  };
}

export async function loginAdmin(username: string, password: string) {
  const normalizedUsername = username.trim();
  if (!normalizedUsername || !password) {
    throw new AppError('用户名和密码不能为空');
  }

  const admin = await prisma.admin.findUnique({
    where: { username: normalizedUsername },
  });

  if (!admin) {
    throw new AppError('用户名或密码错误', 401);
  }

  const isValidPassword = await verifyPassword(password, admin.passwordHash);
  if (!isValidPassword) {
    throw new AppError('用户名或密码错误', 401);
  }

  return sanitizeAdmin(admin);
}

export async function generateAdminApiKey(adminId: number) {
  const apiKey = buildApiKey();

  await prisma.admin.update({
    where: { id: adminId },
    data: {
      apiKey: apiKey.hash,
      apiKeyPrefix: apiKey.prefix,
    },
  });

  return {
    apiKey: apiKey.raw,
    prefix: apiKey.prefix,
  };
}

export async function revokeAdminApiKey(adminId: number) {
  await prisma.admin.update({
    where: { id: adminId },
    data: {
      apiKey: null,
      apiKeyPrefix: null,
    },
  });
}
