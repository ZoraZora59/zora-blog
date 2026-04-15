import './env.js';
import { PrismaClient } from '@prisma/client';

declare global {
  var __zoraPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__zoraPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__zoraPrisma__ = prisma;
}
