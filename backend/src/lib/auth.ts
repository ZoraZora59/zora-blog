import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { env } from './env.js';

const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  adminId: number;
  username: string;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signJwtToken(payload: JwtPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyJwtToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

export function buildApiKey() {
  const raw = `zora_${randomBytes(24).toString('hex')}`;
  return {
    raw,
    prefix: raw.slice(0, 13),
    hash: hashApiKey(raw),
  };
}

export function hashApiKey(rawKey: string) {
  return createHash('sha256')
    .update(`${rawKey}:${env.apiKeySalt}`)
    .digest('hex');
}
