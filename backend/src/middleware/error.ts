import { Prisma } from '@prisma/client';
import type { Context } from 'hono';
import { AppError } from '../lib/app-error.js';
import { failure } from '../lib/response.js';

export function handleError(error: Error, c: Context) {
  if (error instanceof AppError) {
    return failure(c, error.message, error.statusCode, error.details ?? null);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return failure(c, '数据已存在，请检查唯一字段', 409, error.meta ?? null);
    }

    if (error.code === 'P2025') {
      return failure(c, '请求的数据不存在', 404);
    }
  }

  console.error(error);
  return failure(c, '服务器内部错误', 500);
}
