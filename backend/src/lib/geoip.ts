import path from 'node:path';
import { existsSync } from 'node:fs';
import { Reader } from '@maxmind/geoip2-node';
import type { ReaderModel } from '@maxmind/geoip2-node';
import { env } from './env.js';

let reader: ReaderModel | null = null;
let loadAttempted = false;

export interface GeoLookupResult {
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
}

const EMPTY: GeoLookupResult = { country: null, region: null, city: null, timezone: null };

async function ensureReader(): Promise<ReaderModel | null> {
  if (reader) return reader;
  if (loadAttempted) return null;
  loadAttempted = true;

  const dbPath = path.isAbsolute(env.maxmindDbPath)
    ? env.maxmindDbPath
    : path.resolve(process.cwd(), env.maxmindDbPath);

  if (!existsSync(dbPath)) {
    console.warn(`[geoip] MaxMind 数据库未找到: ${dbPath}，地理信息将为 null。运行 scripts/update-geoip.sh 安装。`);
    return null;
  }

  try {
    reader = await Reader.open(dbPath);
    console.warn(`[geoip] MaxMind GeoLite2 已加载: ${dbPath}`);
    return reader;
  } catch (error) {
    console.error('[geoip] 加载 MaxMind 数据库失败', error);
    return null;
  }
}

export async function lookupGeo(ip: string): Promise<GeoLookupResult> {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return EMPTY;
  }

  const r = await ensureReader();
  if (!r) return EMPTY;

  try {
    const result = r.city(ip);
    return {
      country: result.country?.isoCode ?? null,
      region: result.subdivisions?.[0]?.names?.en ?? null,
      city: result.city?.names?.en ?? null,
      timezone: result.location?.timeZone ?? null,
    };
  } catch {
    // 找不到 IP（局域网 / 异常 IP）静默返回空
    return EMPTY;
  }
}

// 进程启动时预加载，便于在启动日志看到状态
export async function preloadGeoip(): Promise<void> {
  await ensureReader();
}
