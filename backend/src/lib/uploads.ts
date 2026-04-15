import path from 'node:path';
import { mkdir } from 'node:fs/promises';

export const uploadsDir = path.resolve(process.cwd(), 'uploads');

export const allowedMimeTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export async function ensureUploadsDir() {
  await mkdir(uploadsDir, { recursive: true });
}
